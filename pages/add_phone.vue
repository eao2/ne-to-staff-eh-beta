<template>
    <div class="cargo-management">
      <div class="top">
        <h1>NE-TO beta PHONE</h1><a href="/"><p>by track</p></a>
      </div>
      
      <!-- Primary Phone Number Search -->
      <div class="search-section">
        <label>Phone Number</label>
        <div class="search-container">
          <input 
            v-model="phoneNumber"
            placeholder="Enter phone number"
            @input="debouncedSearchUser"
          />
          <button 
            @click="searchUser"
            class="btn-search"
          >
            Search
          </button>
          <button 
            @click="clearAll"
            class="btn-search"
          >
            Clear
          </button>
        </div>
      </div>

    <!-- Original cargo form with modified status handling -->
    <form @submit.prevent="submitCargo" class="cargo-form">
      
      <div class="form-section">
        <h2>User Information</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Name</label>
            <input 
              v-model="userData.name"
              :disabled="isExistingUser"
            />
          </div>
        </div>
      </div>
      
      <!-- Modified Cargo Information section -->
      <div class="form-section">
        <h2>Add New Cargo</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Tracking Number</label>
            <input 
              v-model="cargoData.trackingNumber"
              required
            />
          </div>
          <div class="form-group">
            <label>Cargo Type</label>
            <select 
              v-model="cargoData.cargoType"
            >
              <option value="NORMAL">Normal</option>
              <option value="QUICK">Quick</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select 
              v-model="cargoData.currentStatus"
            >
              <option value="PRE_REGISTERED">Pre-registered</option>
              <option value="RECEIVED_AT_ERENHOT">Received at Erenhot</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED_TO_UB">Delivered to UB</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
          <div v-if="cargoData.currentStatus === 'DELIVERED_TO_UB' || cargoData.currentStatus === 'DELIVERED'" class="form-group">
            <label>Price</label>
            <input 
              v-model="cargoData.price"
              type="number"
              step="1"
            />
          </div>
        </div>
      </div>

      <button 
        type="submit"
        class="btn-submit"
        :disabled="!phoneNumber || !cargoData.trackingNumber"
      >
        Add New && Update Cargo Information
      </button>
    </form>

    <div class="breakline"></div>

    <!-- Add new Status Update section -->
    <form @submit.prevent="" class="status-section">
      <h2>Update Status to delivered</h2>
      <div class="form-grid">
        <div class="form-group">
          <label>Tracking Number</label>
          <input 
            v-model="statusUpdate.trackingNumber"
            placeholder="Enter tracking number"
          />
          <button 
            @click="updateToDelivered"
            class="btn-submit"
            :disabled="!statusUpdate.trackingNumber"
          >
            Mark as Delivered
          </button>
        </div>
      </div>
    </form>
  
    <div class="breakline"></div>
      <!-- User Cargos Table -->
      <div v-if="userCargos.length === 0" class="cargos-table-container">
        <p>{{ userCargosMessage }}</p>
      </div>
      <div v-if="userCargos.length > 0" class="cargos-table-container">
        <h2>User Cargos</h2>
        <h3>Name: {{ userCargosName }}</h3>
        <h4 v-if="totalPrice > 0">Total Price (Delivered to UB): {{ totalPrice }}₮</h4>
        <table class="cargos-table">
          <thead>
            <tr>
              <th>Tracking Number</th>
              <th>Type</th>
              <th>Status</th>
              <th>Price</th>
              <th>Latest Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cargo in sortedUserCargos" :key="cargo.id">
              <td>{{ cargo.trackingNumber }}</td>
              <td>{{ cargo.cargoType }}</td>
              <td>{{ formatStatus(cargo.currentStatus) }}</td>
              <td>{{ cargo.price ? `$${cargo.price}` : '-' }}</td>
              <td>{{ formatDate(getLatestDate(cargo)) }}</td>
              <td>
                <button @click="editCargo(cargo)" class="btn-edit">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <style lang="scss">
  @use "./index.scss";
  </style>
  
<script setup>
  import { ref, computed, watch, onUnmounted } from 'vue'
  
  const phoneNumber = ref('')
  const isExistingUser = ref(false)
  const userCargos = ref([])
  const userCargosName = ref('')
  const userCargosMessage = ref('')
  let searchTimeout = null

  const statusUpdate = ref({
  trackingNumber: ''
  })
  
  const userData = ref({
    phoneNumber: '',
    name: ''
  })
  
  const cargoData = ref({
    trackingNumber: '',
    nickname: '',
    cargoType: 'NORMAL',
    currentStatus: 'PRE_REGISTERED',
    price: null,
    preRegisteredDate: null,
    receivedAtErenhotDate: null,
    inTransitDate: null,
    deliveredToUBDate: null,
    deliveredDate: null
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
        clearAll()
      }
    }, 500)
  }
  
  const totalPrice = computed(() => {
    return userCargos.value
      .filter(cargo => cargo.currentStatus === 'DELIVERED_TO_UB' && cargo.price)
      .reduce((sum, cargo) => sum + Number(cargo.price), 0)
  })
  
  // Status priority for sorting
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
  
  function formatStatus(status) {
    return status.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
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
  
  async function updateToDelivered() {
    if (!statusUpdate.value.trackingNumber.trim()) {
      alert('Tracking number is required')
      return
    }

    try {
      await $fetch('/api/cargo/save', {
        method: 'POST',
        body: {
          trackingNumber: statusUpdate.value.trackingNumber.trim(),
          cargo: {
            currentStatus: 'DELIVERED'
          }
        }
      })
      
      alert('Status updated successfully')
      statusUpdate.value.trackingNumber = ''
      if (phoneNumber.value) {
        await searchUser()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }
  
  watch(() => cargoData.value.currentStatus, (newStatus) => {
    if (newStatus !== 'DELIVERED_TO_UB' && newStatus !== 'DELIVERED') {
      cargoData.value.price = null
    }
  })
  
  async function searchUser() {
    if (!phoneNumber.value.trim()) {
      clearAll()
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
      userCargosMessage.value = response.message || ''
      
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
    if (!phoneNumber.value.trim() || !cargoData.value.trackingNumber.trim()) {
      alert('Phone number and tracking number are required')
      return
    }
  
    try {
      const submissionData = {
        trackingNumber: cargoData.value.trackingNumber.trim(),
        cargo: {
          nickname: cargoData.value.nickname,
          cargoType: cargoData.value.cargoType,
          currentStatus: cargoData.value.currentStatus,
          price: cargoData.value.price,
          preRegisteredDate: cargoData.value.preRegisteredDate,
          receivedAtErenhotDate: cargoData.value.receivedAtErenhotDate,
          inTransitDate: cargoData.value.inTransitDate,
          deliveredToUBDate: cargoData.value.deliveredToUBDate,
          deliveredDate: cargoData.value.deliveredDate
        },
        user: {
          phoneNumber: phoneNumber.value.trim(),
          name: userData.value.name
        }
      }
  
      await $fetch('/api/cargo/save', {
        method: 'POST',
        body: submissionData
      })
      
      alert('Cargo information saved successfully')
      await searchUser()
      clearCargoForm()
    } catch (error) {
      console.error('Error saving cargo:', error)
      alert('Error saving cargo information')
    }
  }
  
  function clearCargoForm() {
    cargoData.value = {
      trackingNumber: '',
      nickname: '',
      cargoType: 'NORMAL',
      currentStatus: 'PRE_REGISTERED',
      price: null,
      preRegisteredDate: null,
      receivedAtErenhotDate: null,
      inTransitDate: null,
      deliveredToUBDate: null,
      deliveredDate: null
    }
  }
  
  function clearAll() {
    phoneNumber.value = ''
    userData.value = {
      phoneNumber: '',
      name: ''
    }
    isExistingUser.value = false
    userCargos.value = []
    userCargosName.value = ''
    userCargosMessage.value = ''
    clearCargoForm()
  }
  
  async function editCargo(cargo) {
    cargoData.value = { ...cargo }
  }
  
  onUnmounted(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  })
  </script>