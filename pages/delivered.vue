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
              />
              <button @click="searchUser" class="btn-search">Хайх</button>
              <button @click="clearData" class="btn-search">Цэвэрлэх</button>
            </div>
          </div>
          
          <div class="search-group">
            <label>Трак Код:</label>
            <div class="search-container">
              <input 
                v-model="trackingNumber"
                placeholder="Трак код оруулах"
                @keydown.enter="setDelivered"
                :disabled="!phoneNumber"
              />
              <button 
                @click="setDelivered" 
                class="btn-search"
                :disabled="!phoneNumber || !trackingNumber"
              >
                Хүлээлгэж өгөх
              </button>
            </div>
          </div>
        </div>
  
        <div v-if="userCargos.length > 0" class="cargos-table-container">
          <h2 class="user-name">{{ userCargosName }}</h2>
          <h3 class="total-price" v-if="totalPrice > 0">Нийт Дүн: {{ numberWithCommas(totalPrice) }}₮</h3>
            <div class="actions-container">
            <button
                @click="setAllDelivered" 
                class="btn-deliver-all"
                v-if="hasDeliverableItems"
            >
                Бүх Карго Авсан
            </button>
            </div>
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
                            <td>{{ cargo.nickname }}</td>
                            <td>{{ cargo.cargoType === 'NORMAL' ? 'Энгийн' : 'Шуурхай' }}</td>
                            <td>{{ formatStatus(cargo.currentStatus) }}</td>
                            <td>{{ cargo.price ? `${numberWithCommas(cargo.price)} ₮` : '-' }}</td>
                            <td>{{ formatDate(getLatestDate(cargo)) }}</td>
                            <td>
                            <button 
                                v-if="cargo.currentStatus === 'DELIVERED_TO_UB'"
                                @click="setCargoDelivered(cargo)" 
                                class="btn-delivered"
                            >
                                Авсан
                            </button>
                            <span v-else>{{ cargo.currentStatus === 'DELIVERED' ? 'Хүлээлгэж өгсөн' : '-' }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  
  const phoneNumber = ref('')
  const trackingNumber = ref('')
  const userCargos = ref([])
  const userCargosName = ref('')
  let searchTimeout = null
  
  const totalPrice = computed(() => {
    return userCargos.value
      .filter(cargo => cargo.currentStatus === 'DELIVERED_TO_UB' && cargo.price)
      .reduce((sum, cargo) => sum + Number(cargo.price), 0)
  })
  
  const hasDeliverableItems = computed(() => {
    return userCargos.value.some(cargo => cargo.currentStatus === 'DELIVERED_TO_UB')
  })
  
  const statusPriority = {
    'PRE_REGISTERED': 1,
    'RECEIVED_AT_ERENHOT': 2,
    'IN_TRANSIT': 3,
    'DELIVERED_TO_UB': 4,
    'DELIVERED': 5
  }
  
  const sortedUserCargos = computed(() => {
    return [...userCargos.value].sort((a, b) => {
      return statusPriority[a.currentStatus] - statusPriority[b.currentStatus]
    })
  })
  
  function debouncedSearchUser() {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    searchTimeout = setTimeout(() => {
      if (phoneNumber.value.trim()) {
        searchUser()
      } else {
        clearData()
      }
    }, 500)
  }
  
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
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
  
  function formatDate(date) {
    if (!date) return '-'
    return `${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString({hourCycle: 'h24'})}`
  }
  
  function getLatestDate(cargo) {
    const dates = [
      cargo.deliveredDate,
      cargo.deliveredToUBDate,
      cargo.inTransitDate,
      cargo.receivedAtErenhotDate,
      cargo.preRegisteredDate
    ]
    return dates.find(date => date) || null
  }
  
  async function searchUser() {
    if (!phoneNumber.value.trim()) {
      clearData()
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
    } catch (error) {
      console.error('Error searching user:', error)
      alert('Error searching user')
    }
  }
  
  async function setDelivered() {
    if (!trackingNumber.value.trim() || !phoneNumber.value.trim()) {
      alert('Утасны дугаар болон трак код оруулна уу')
      return
    }
  
    try {
      await $fetch('/api/cargo/set-delivered', {
        method: 'POST',
        body: {
          trackingNumber: trackingNumber.value.trim(),
          phoneNumber: phoneNumber.value.trim()
        }
      })
      
      trackingNumber.value = ''
      await searchUser()
    } catch (error) {
      console.error('Error setting delivered status:', error)
      alert(error.message || 'Error updating cargo status')
    }
  }
  
  async function setCargoDelivered(cargo) {
    try {
      await $fetch('/api/cargo/set-delivered', {
        method: 'POST',
        body: {
          trackingNumber: cargo.trackingNumber,
          phoneNumber: phoneNumber.value.trim()
        }
      })
      
      await searchUser()
    } catch (error) {
      console.error('Error setting delivered status:', error)
      alert('Error updating cargo status')
    }
  }
  
  async function setAllDelivered() {
    if (!confirm('Бүх каргог хүлээлгэж өгсөн болгох уу?')) {
      return
    }
  
    try {
      await $fetch('/api/cargo/set-all-delivered', {
        method: 'POST',
        body: {
          phoneNumber: phoneNumber.value.trim()
        }
      })
      
      await searchUser()
    } catch (error) {
      console.error('Error setting all cargos to delivered:', error)
      alert('Error updating cargo statuses')
    }
  }
  
  function clearData() {
    phoneNumber.value = ''
    trackingNumber.value = ''
    userCargos.value = []
    userCargosName.value = ''
  }
  
  onUnmounted(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  })
  </script>
  
<style lang="scss" scoped>
$primary-color: #1a73e8;
$secondary-color: #4285f4;
$background-color: #f8f9fa;
$border-color: #e0e0e0;
$text-color: #202124;
$sidebar-width: 280px;

// Mixins
@mixin flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

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
        &:last-child {
        margin-bottom: 0;
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
      margin-top: 16px;

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

// Reuse existing styles and add:
.actions-container {
    margin-bottom: 1rem;
}

.btn-delivered {
    @include button-base;
    background-color: #34A853;
    color: white;

    &:hover {
        filter: brightness(0.9);
    }
}

.btn-deliver-all {
@include button-base;
    background-color: #34A853;
    color: white;
    margin: 0 0 0 1rem;

    &:hover {
        filter: brightness(0.9);
    }
}

input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
}

button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;

    &:hover {
        filter: none;
    }
}
</style>