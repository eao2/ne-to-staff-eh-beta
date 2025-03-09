<template>
  <div class="cargo-management">
    <SideBar />
    <div class="main-content">
      <div class="search-section">
        <div class="search-group">
          <label>Утасны Дугаар:</label>
          <div class="search-container">
            <input 
              v-model="phoneNumber"
              placeholder="Утасны дугаар оруулах"
              @input="debouncedSearchUser"
              autofocus
            />
            <button @click="searchUser" class="btn-search">Хайх</button>
            <button @click="clearUserDataAll" class="btn-search">Цэвэрлэх</button>
          </div>
        </div>
        
        <div class="search-group">
          <label>Захиалагчийн Нэр:</label>
          <input 
            v-model="userData.name"
            :disabled="isExistingUser"
            placeholder="Захиалагчийн нэр"
          />
        </div>
      </div>

      <form
        @submit.prevent
        class="cargo-form">
        <div class="form-section">
          <div class="form-grid">
            <div class="form-group">
              <label>Төрөл:</label>
              <div class="cargo-type-options">
                <input 
                  id="normal"
                  type="radio" 
                  v-model="cargoData.cargoType" 
                  value="NORMAL"
                  tabindex="1"
                  name="cargoType"
                />
                <label for="normal" class="radio-box">
                  <span class="radio-label">Энгийн</span>
                </label>
                <input
                  id="quick"
                  type="radio" 
                  v-model="cargoData.cargoType" 
                  value="QUICK"
                  tabindex="2"
                  name="cargoType"
                />
                <label for="quick" class="radio-box">
                  <span class="radio-label">Шуурхай</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Төлөх дүн:</label>
              <input 
                type="number"
                v-model="cargoData.price"
                placeholder="Төлөх дүн оруулах"
                required
                @keydown.enter.prevent="$refs.trackingNumber.focus()"
                ref="cargoPrice"
              />
            </div>

            <div class="form-group">
              <label>Трак Код:</label>
              <input
                type="text"
                v-model="cargoData.trackingNumber"
                required
                placeholder="Трак код оруулах"
                @keydown.enter.prevent="submitCargo"
                ref="trackingNumber"
              />
            </div>
            
            <button 
              type="submit"
              class="btn-submit"
              :disabled="!cargoData.trackingNumber"
              @click="submitCargo"
            >
              Ачааны мэдээлэл нэмэх
            </button>
          </div>
        </div>
      </form>

      <div v-if="userCargos.length > 0" class="cargos-table-container">
        <h2 class="user-name">{{ userCargosName }}</h2>
        <h3 class="total-price" v-if="totalPrice > 0">Нийт Дүн: {{ numberWithCommas(totalPrice) }}₮</h3>
        <table class="cargos-table">
          <thead>
            <tr>
              <th>Трак Код</th>
              <th>Нэр</th>
              <th>Төрөл</th>
              <th>Төлөв</th>
              <th>Үнэ</th>
              <th>Сүүлийн Шинэчлэл</th>
              <th>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cargo in sortedUserCargos" :key="cargo.id">
              <td>{{ cargo.trackingNumber }}</td>
              <td>{{ cargo.nickname || '-' }}</td>
              <td>{{ cargo.cargoType === 'NORMAL' ? 'Энгийн' : 'Шуурхай' }}</td>
              <td>{{ formatStatus(cargo.currentStatus) }}</td>
              <td>{{ cargo.price ? `${numberWithCommas(cargo.price)} ₮` : '-' }}</td>
              <td>{{ formatDate(getLatestDate(cargo)) }}</td>
              <td class="action-buttons">
                <button @click="editCargo(cargo)" class="btn-edit">Засах</button>
                <button 
                  v-if="canDelete(cargo)" 
                  @click="deleteCargo(cargo)" 
                  class="btn-delete"
                >
                  Устгах
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #1a73e8;
$secondary-color: #4285f4;
$background-color: #f8f9fa;
$border-color: #e0e0e0;
$text-color: #202124;
$danger-color: #dc3545;
$sidebar-width: 280px;

// Mixins
@mixin button-base {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cargo-management {
  display: flex;

  .main-content {
    margin-left: $sidebar-width;
    width: calc(100% - #{$sidebar-width});
    background-color: $background-color;
  }
}

// Form Styles
.search-section {
  padding: 12px 1.5rem;
  display: flex;
  background-color: #F6F6F6;
  border-bottom: 1px dashed #DBE0E0;
  align-items: center;
  gap: 1.5rem;
  .search-group {
    display: flex;
    align-items: center;
    gap: 8px;
    .search-container{
      display: flex;
      gap: 1rem;
    }
  }
}

.form-grid{
  padding: 12px 1.5rem;
  display: flex;
  background-color: #F6F6F6;
  border-bottom: 1px dashed #DBE0E0;
  align-items: center;
  gap: 1.5rem;
  .form-group{
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.cargo-type-options {
  display: flex;
  
  input[type="radio"] {
    display: none;
    &:checked + .radio-box {
      color: #fff;
      background-color: $primary-color;
    }
  }

  .radio-box {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    width: 7.5rem;
    height: 2.5rem;
    background-color: #fff;

    .radio-label {
      display: block;
      text-align: center;
      font-weight: 500;
    }
  }
}

input{
  max-width: 15rem;
  height: 2.5rem;
  border-radius: 8px;
  border: 1px solid $border-color;
  color: $text-color;
  padding: 8px;
  background-color: #ffffff;
}

// Table Styles
.cargos-table-container {
  background-color: white;
  border-radius: 8px;
  padding-top: 1rem;

  .user-name{
    margin: 0 1rem;
    font-weight: 600;
  }

  .total-price{
    margin: 1rem;
    font-weight: 500;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px dashed $border-color;
    }

    th {
      font-weight: 500;
      color: $text-color;
      background-color: rgba($primary-color, 0.05);
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
}

// Button Styles
.btn-search {
  @include button-base;
  background-color: $primary-color;
  color: white;

  &:hover {
    filter: brightness(0.9)
  }
}

.btn-submit {
  @include button-base;
  background-color: $secondary-color;
  color: white;

  &:disabled {
    background-color: $border-color;
    cursor: not-allowed;
  }
}

.btn-edit {
  @include button-base;
  background-color: transparent;
  color: $primary-color;

  &:hover {
    filter: brightness(0.9)
  }
}

.btn-delete {
  @include button-base;
  background-color: transparent;
  color: $danger-color;
  
  &:hover {
    background-color: rgba($danger-color, 0.1);
  }
}
</style>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const phoneNumber = ref('')
const isExistingUser = ref(false)
const userCargos = ref([])
const userCargosName = ref('')
let searchTimeout = null

const userData = ref({
  phoneNumber: '',
  name: ''
})

const cargoData = ref({
  trackingNumber: '',
  cargoType: 'NORMAL',
  price: null
})

// Create a debounced search function
function debouncedSearchUser() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    if (phoneNumber.value.trim()) {
      searchUser()
    } else {
      clearUserDataAll()
    }
  }, 500)
}

const totalPrice = computed(() => {
  return userCargos.value
    .filter(cargo => cargo.currentStatus === 'DELIVERED_TO_UB' && cargo.price)
    .reduce((sum, cargo) => sum + Number(cargo.price), 0)
})

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatStatus(status) {
  const statusMap = {
    'PRE_REGISTERED': 'Хэрэглэгч бүртгүүлсэн',
    'RECEIVED_AT_ERENHOT': 'Эрээнд ирсэн',
    'IN_TRANSIT': 'Замд яваа',
    'DELIVERED_TO_UB': 'УБ-д ирсэн',
    'DELIVERED': 'Хүлээлгэж өгсөн'
  }
  return statusMap[status] || status
}

// Status priority for sorting
const statusPriority = {
  'DELIVERED_TO_UB': 1
}

const sortedUserCargos = computed(() => {
  return [...userCargos.value]
})

function formatDate(date) {
  if (!date) return '-'
  return `${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString({hourCycle: 'h24'})}`
}

function getLatestDate(cargo) {
  const dates = [
    cargo.deliveredToUBDate
  ]
  return dates.find(date => date) || null
}

function canDelete(cargo) {
  // Allow deletion only for cargos with DELIVERED_TO_UB status and no other status dates
  return cargo.currentStatus === 'DELIVERED_TO_UB' && 
         !cargo.preRegisteredDate && 
         !cargo.receivedAtErenhotDate && 
         !cargo.inTransitDate && 
         !cargo.deliveredDate
}

async function searchUser() {
  if (!phoneNumber.value.trim()) {
    clearUserDataAll()
    return
  }

  try {
    const response = await $fetch('/api/cargo/user-cargos', {
      method: 'POST',
      body: {
        phoneNumber: phoneNumber.value.trim()
      }
    })
    
    userCargos.value = response.cargos || []
    userCargosName.value = response.name || ''
    
    if (response.name) {
      userData.value.name = response.name
      userData.value.phoneNumber = phoneNumber.value.trim()
      isExistingUser.value = true
    } else {
      userData.value.name = ''
      userData.value.phoneNumber = phoneNumber.value.trim()
      isExistingUser.value = false
    }
  } catch (error) {
    console.error('Error searching user:', error)
    alert('Error searching user')
  }
}

async function submitCargo() {
  if (!cargoData.value.trackingNumber.trim()) {
    alert('Tracking number is required')
    return
  }

  try {
    const submissionData = {
      trackingNumber: cargoData.value.trackingNumber.trim(),
      cargo: {
        cargoType: cargoData.value.cargoType,
        price: cargoData.value.price,
      },
      user: phoneNumber.value ? {
        phoneNumber: phoneNumber.value.trim(),
        name: userData.value.name
      } : null
    }

    await $fetch('/api/cargo/set-delivered-to-ub', {
      method: 'POST',
      body: submissionData
    })

    clearCargoForm()
    if (phoneNumber.value) {
      await searchUser()
    } else {
      // If no phone number, just clear the form
      alert('Cargo registered without user association')
    }
  } catch (error) {
    console.error('Error saving cargo:', error)
    alert('Error saving cargo information')
  }
}

async function deleteCargo(cargo) {
  if (!confirm(`Are you sure you want to delete cargo "${cargo.trackingNumber}"?`)) {
    return
  }

  try {
    await $fetch('/api/cargo/delete-delivered-to-ub', {
      method: 'POST',
      body: {
        trackingNumber: cargo.trackingNumber
      }
    })
    
    // Remove from local array
    userCargos.value = userCargos.value.filter(c => c.trackingNumber !== cargo.trackingNumber)
  } catch (error) {
    console.error('Error deleting cargo:', error)
    alert('Error deleting cargo information')
  }
}

function clearCargoForm() {
  cargoData.value.trackingNumber = ''
  cargoData.value.price = null
}

function clearUserDataAll() {
  phoneNumber.value = ''
  userData.value = {
    phoneNumber: '',
    name: ''
  }
  isExistingUser.value = false
  userCargos.value = []
  userCargosName.value = ''
}

function editCargo(cargo) {
  cargoData.value = { 
    trackingNumber: cargo.trackingNumber,
    cargoType: cargo.cargoType,
    price: cargo.price
  }
}

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>