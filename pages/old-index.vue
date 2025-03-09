<template>
  <div class="cargo-management">
    <div class="top"><h1>NE-TO beta TRACK</h1><a href="/add_phone"><p>by phone</p></a></div>

    <!-- Original Search Section -->
    <div class="search-section">
        <label>Tracking Number</label>
        <div class="search-container">
          <input 
            v-model="trackingNumber"
            placeholder="Enter tracking number"
            @input="debouncedSearchCargo"
          />
          <button 
            @click="searchCargo"
            class="btn-search"
          >
            Search
          </button>
          <button 
            @click="trackingNumber = ''"
            class="btn-search"
          >
            Clear
          </button>
        </div>
      </div>
  
      <!-- Rest of the original template remains exactly the same until the script section -->
      <form @submit.prevent="submitCargo" class="cargo-form">
        <!-- User Information section - unchanged -->
        <div class="form-section">
          <h2>User Information (Optional)</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Phone Number</label>
              <input 
                v-model="userData.phoneNumber"
                @input="handlePhoneNumberChange"
              />
            </div>
            <div class="form-group">
              <label>Name</label>
              <input 
                v-model="userData.name"
              />
            </div>
          </div>
        </div>
  
        <!-- Modified Cargo Information section -->
        <div class="form-section">
          <h2>Cargo Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Nickname (Optional)</label>
              <input 
                v-model="cargoData.nickname"
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
        >
          Save Cargo Information
        </button>
      </form>
  
          <!-- Status Update Section -->
      <form @submit.prevent="" class="search-section">
        <label>Update Status</label>
        <div class="search-container">
          <input 
            v-model="quickUpdate.trackingNumber"
            placeholder="Enter tracking number for quick update"
          />
          <button 
            @click="updateToDelivered"
            class="btn-search"
            :disabled="!quickUpdate.trackingNumber"
          >
            Mark Delivered
          </button>
        </div>
      </form>
  
      <!-- User Cargos Table -->
      <div v-if="userCargos.length == 0" class="cargos-table-container">
        <p>{{ usercargosMessage }}</p>
      </div>
      <div v-if="userCargos.length > 0" class="cargos-table-container">
        <h2>User Cargos</h2>
        <h3>Name: {{ userCargosName }}</h3>
        <h4 v-if="totalPrice > 0">Total Price (Delivered to UB): {{ totalPrice }}₮</h4>
        <table class="cargos-table">
          <thead>
            <tr>
              <th>Tracking Number</th>
              <!-- <th>Nickname</th> -->
              <th>Type</th>
              <th>Status</th>
              <th>Price</th>
              <th>Latest Update</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cargo in sortedUserCargos" :key="cargo.id">
              <td>{{ cargo.trackingNumber }}</td>
              <!-- <td>{{ cargo.nickname || '-' }}</td> -->
              <td>{{ cargo.cargoType }}</td>
              <td>{{ formatStatus(cargo.currentStatus) }}</td>
              <td>{{ cargo.price ? `$${cargo.price}` : '-' }}</td>
              <td>{{ formatDate(getLatestDate(cargo)) }}</td>
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
  import { ref, computed, watch } from 'vue'
  
  const trackingNumber = ref('')
  const searchPhoneNumber = ref('')
  const isExistingUser = ref(false)
  const userCargos = ref([])
  const userCargosName = ref('')
  const usercargosMessage = ref('')
  let searchTimeout = null
  
  // Create a debounced search function
  function debouncedSearchCargo() {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    searchTimeout = setTimeout(() => {
      if (trackingNumber.value.trim()) {
        searchCargo()
      } else {
        clearForm()
      }
    }, 500) // 500ms delay
  }
  
  // Handle phone number changes
  function handlePhoneNumberChange() {
    // Clear the name when phone number changes
    userData.value.name = ''
    // Reset existing user flag to allow saving new user data
    isExistingUser.value = false
  }
  
  const totalPrice = computed(() => {
    return userCargos.value
      .filter(cargo => cargo.currentStatus === 'DELIVERED_TO_UB' && cargo.price)
      .reduce((sum, cargo) => sum + Number(cargo.price), 0)
  })
  
  // Add new ref for quick update
  const quickUpdate = ref({
    trackingNumber: ''
  })
  
  // Keep existing user and cargo data structure
  const userData = ref({
    phoneNumber: '',
    name: ''
  })
  
  const cargoData = ref({
    nickname: '',
    cargoType: 'NORMAL',
    currentStatus: 'RECEIVED_AT_ERENHOT',
    price: null
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
  
  async function searchUserCargos(phoneNumber) {
    if (!phoneNumber){
      userCargos.value = []
      usercargosMessage.value = 'cleared'
      return
    }
    
    try {
      const response = await $fetch('/api/cargo/user-cargos', {
        method: 'POST',
        body: {
          phoneNumber: phoneNumber
        }
      })
      
      userCargos.value = response.cargos || []
      userCargosName.value = response.name || ''
      usercargosMessage.value = response.message || ''
    } catch (error) {
      console.error('Error searching user cargos:', error)
      alert('Error searching user cargos')
    }
  }
  
  
  // Reset price when status changes from DELIVERED_TO_UB
  watch(() => cargoData.value.currentStatus, (newStatus) => {
    if (newStatus !== 'DELIVERED_TO_UB' && newStatus !== 'DELIVERED') {
      cargoData.value.price = null
    }
  })
  
  async function updateToDelivered() {
    if (!quickUpdate.value.trackingNumber.trim()) {
      alert('Tracking number is required')
      return
    }
  
    try {
      await $fetch('/api/cargo/save', {
        method: 'POST',
        body: {
          trackingNumber: quickUpdate.value.trackingNumber.trim(),
          cargo: {
            currentStatus: 'DELIVERED'
          }
        }
      })
      
      alert('Status updated successfully')
      quickUpdate.value.trackingNumber = ''
      if (userData.value.phoneNumber) {
        await searchUserCargos(userData.value.phoneNumber)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }
  
  async function submitCargo() {
    if (!trackingNumber.value.trim()) {
      alert('Tracking number is required')
      return
    }
  
    try {
      let submissionData = {
        trackingNumber: trackingNumber.value.trim(),
        cargo: {
          currentStatus: cargoData.value.currentStatus,
          price: cargoData.value.price
        }
      }
  
      // Only include optional fields for new entries or modifications
      if (!isExistingUser.value || cargoData.value.nickname || cargoData.value.cargoType) {
        submissionData.cargo = {
          ...submissionData.cargo,
          nickname: cargoData.value.nickname,
          cargoType: cargoData.value.cargoType
        }
        if (userData.value.phoneNumber) {
          submissionData.user = userData.value
        }
      }
  
      await $fetch('/api/cargo/save', {
        method: 'POST',
        body: submissionData
      })
      
      alert('Cargo information saved successfully')
      
      if (userData.value.phoneNumber) {
        await searchUserCargos(userData.value.phoneNumber)
        searchPhoneNumber.value = userData.value.phoneNumber
      }
    } catch (error) {
      console.error('Error saving cargo:', error)
      alert('Error saving cargo information')
    }
  }
  
  function clearForm() {
    userData.value = {
      phoneNumber: '',
      name: ''
    }
    isExistingUser.value = false
    cargoData.value = {
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
  
  async function searchCargo() {
    if (!trackingNumber.value.trim()) {
      clearForm()
      return
    }
  
    try {
      const response = await $fetch('/api/cargo/search', {
        method: 'POST',
        body: {
          trackingNumber: trackingNumber.value.trim()
        }
      })
      
      if (response.cargo) {
        const currentStatus = cargoData.value.currentStatus
        
        cargoData.value = {
          ...response.cargo,
          currentStatus: response.cargo.currentStatus || currentStatus
        }
        
        if (response.cargo.user) {
          userData.value = {
            phoneNumber: response.cargo.user.phoneNumber,
            name: response.cargo.user.name
          }
          isExistingUser.value = true
        } else {
          clearForm()
        }
      } else {
        clearForm()
      }
    } catch (error) {
      console.error('Error searching cargo:', error)
      alert('Error searching cargo')
    }
  }
  
  // Clean up the timeout when component is unmounted
  onUnmounted(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  })
  </script>
  