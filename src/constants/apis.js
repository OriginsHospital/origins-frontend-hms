import { API_ROUTES } from './constants'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'

export const getLoggedUserInfo = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Access-Control-Allow-Origin', '*')
  myHeaders.append('Access-Control-Allow-Credentials', true)

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + API_ROUTES.LOGGED_USER_INFO,
    {
      method: 'GET',
      headers: myHeaders,
      credentials: 'include',
    },
  )

  return response.json()
}

export const getNewAccessToken = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Access-Control-Allow-Origin', '*')
  myHeaders.append('Access-Control-Allow-Credentials', true)

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + API_ROUTES.GET_NEW_ACCESS_TOKEN,
    {
      method: 'GET',
      headers: myHeaders,
      credentials: 'include',
    },
  )

  return response.json()
}

export const getUsersList = async (token, isvalidusers) => {
  // console.log(token, isvalidusers)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  // myHeaders.append("Access-Control-Allow-Origin", "*");
  myHeaders.append('Access-Control-Allow-Credential', 'true')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.USERS_LIST}?page=${1}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        isVerified: isvalidusers,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  // if (data.status !== 200) {
  //     handleLogout()
  // }
  // console.log(data);
  // .then(response => response.json())
  // .then(res => {
  //     console.log(res.data.users)
  //     //  setRows(res.data.users)
  //     return res.data.users
  // })
  // .catch(error => {
  //     console.error(error);
  // });
  return data
}

export const getValidUsersList = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Access-Control-Allow-Credential', 'true')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VALID_USERS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  return data
}

export const getRoles = async () => {
  // const myHeaders = new Headers();
  // myHeaders.append("Content-Type", "application/json");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ROLES}`,
    {
      method: 'GET',
      // headers: myHeaders,
      redirect: 'follow',
      // credentials: 'include'
    },
  )
  const data = await response.json()
  // console.log(data);

  return data
}
export const getModules = async () => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)

  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_MODULES}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  // console.log("modules list", data);
  return data
}
export const getRoleDetails = async (roleid) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ROLE_DETAIL}/${roleid}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  // console.log("role details", data);
  return data
}

// export const validateUser = async (payload) => {
//     console.log('validating', Permissions)
//     const myHeaders = new Headers();
//     myHeaders.append("Authorization", `Bearer ${localStorage.getItem('token')}`);
//     myHeaders.append("Content-Type", "application/json");
//     const raw = JSON.stringify(payload);

//     const requestOptions = {
//         method: "PUT",
//         headers: myHeaders,
//         body: raw,
//         redirect: "follow",
//         credentials: 'include'
//     };

//     fetch("https://13.234.149.138:3000/users/updateUserDetails", requestOptions)
//         .then((response) => response.json())
//         .then((result) => console.log(result))
//         .catch((error) => console.error(error));

// }
export const getUserDetails = async (userid) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_USER_DETAILS}/${userid}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  console.log('user details', data)
  return data
}

export const validateUser = async (row, Permissions) => {
  console.log('validating', Permissions)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)
  myHeaders.append('Content-Type', 'application/json')
  const raw = JSON.stringify({
    id: row?.id,
    isAdminVerified: 1,
    roleDetails: row?.roleDetails,
    //   isBlocked: 0,
    // roleDetails: row.roleDetails,
    branchDetails: row?.branchDetails,
    moduleList: Permissions,
  })

  const requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
    credentials: 'include',
  }
  // console.log(raw)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.VALIDATE_USER}`,
    requestOptions,
  )
  // .then((response) => response.json())
  // .then((result) => console.log(result))
  // .catch((error) => console.error(error));
  const data = await response.json()
  // console.log(data)
  return data
}

export const logout = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.LOGOUT}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}
export const closeVisit = async (token, appointmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_VISIT}/${appointmentId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllPatients = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENTS}?searchQuery=${searchValue}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getPatientTreatmentCycles = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_TREATMENTCYCLES}?searchQuery=${searchValue}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getDonarInformation = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DONAR_INFORMATION}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getDonarDataByVisit = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DONAR_DATA_BY_VISIT}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const saveDonarRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const body = new FormData()
  Object.keys(payload).forEach((key) => {
    if (payload[key]) {
      body.append(key, payload[key])
    }
  })

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: body,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_DONAR_RECORD}`,
    requestOptions,
  )
  return response.json()
}

export const updateDonarRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const body = new FormData()
  Object.keys(payload).forEach((key) => {
    if (payload[key]) {
      body.append(key, payload[key])
    }
  })

  const requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: body,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_DONAR_RECORD}`,
    requestOptions,
  )
  return response.json()
}

export const deleteDonorFile = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELET_DONOR_FILE}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDropdowns = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DROPDOWNS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientByAadharOrMobile = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENTS_BY_AADHAAR_OR_MOBILE}/${searchValue}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getCities = async function (token, stateId) {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CITIES}${stateId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const createPatientRecord = async (
  token,
  payload,
  file,
  // uploadedDocuments,
) => {
  const formData = new FormData()
  const { aadhaarCard, marriageCertificate, affidavit, ...rest } = payload

  Object.keys(rest).forEach((key) => {
    if (typeof payload[key] === 'object') {
      formData.append(key, JSON.stringify(payload[key]))
    } else {
      formData.append(key, payload[key])
    }
  })

  if (file) formData.append('file', file)
  if (typeof aadhaarCard === 'object') {
    formData.append('aadhaarCard', aadhaarCard)
    // console.log(aadhaarCard)
  }
  if (typeof marriageCertificate === 'object') {
    formData.append('marriageCertificate', marriageCertificate)
  }
  if (typeof affidavit === 'object') {
    formData.append('affidavit', affidavit)
  }

  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: formData,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_PATIENT_RECORD}`,
    requestOptions,
  )

  return response.json()
}

export const editPatientRecord = async (
  token,
  payload,
  file,
  // uploadedDocuments,
) => {
  const formData = new FormData()
  const { aadhaarCard, marriageCertificate, affidavit, ...rest } = payload
  Object.keys(rest).forEach((key) => {
    // console.log(key, payload[key])
    if (typeof payload[key] === 'object') {
      formData.append(key, JSON.stringify(payload[key]))
    } else {
      formData.append(key, payload[key])
    }
  })
  // console.log(typeof file)
  if (file && typeof file == 'object') formData.append('file', file)
  if (aadhaarCard && typeof aadhaarCard === 'object') {
    formData.append('aadhaarCard', aadhaarCard)
    // console.log(aadhaarCard)
  }
  if (marriageCertificate && typeof marriageCertificate === 'object') {
    formData.append('marriageCertificate', marriageCertificate)
  }
  if (affidavit && typeof affidavit === 'object') {
    formData.append('affidavit', affidavit)
  }
  // console.log(formData, file, uploadedDocuments)
  // if (uploadedDocuments?.length > 0) {
  //   uploadedDocuments.forEach(eachDoc =>
  //     typeof file == 'object' ? formData.append('uploadedDocuments', eachDoc) : eachDoc
  //   )
  // }
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: formData,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_PATIENT_RECORD}`,
    requestOptions,
  )

  return response.json()
}
export const getPackageData = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PACKAGE_DATA}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//create package
export const createPackage = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_PACKAGE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//edit package
export const editPackage = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_PACKAGE}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const editGuardianRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_GUARDIAN_RECORD}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const createGuardianRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_GUARDIAN_RECORD}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getVisitsByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VISIT_BY_PATIENTID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createVisit = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_VISIT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getVisitInfoById = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VISIT_INFO}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDoctorsList = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DOCTORS_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveBlockedTimeSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_BLOCKED_TIME_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBlockedTimeSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BLOCKED_TIME_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveDoctorAvailability = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_DOCTOR_AVAILABILITY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDoctorsForAvailability = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DOCTORS_FOR_AVAILABILITY}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createConsultationOrTreatment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_CONSULTATION_OR_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
// /api/getTreatmentTypes
export const getTreatmentTypes = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_TYPES}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
// GET_APPOINTMENTS_REASONS_LIST
export const getAllAppointmentsReasons = async (token, type, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_REASONS_LIST}?type=${type}&id=${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAppointmentReasonsByPatientType = async (
  token,
  patientTypeId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENT_REASONS_BY_PATIENT_TYPE}?patientTypeId=${patientTypeId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const bookConsultationAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_CONSULTATION_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const bookReviewCallConsultationAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_REVIEW_CALL_CONSULTATION_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const bookTreatmentAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_TREATMENT_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getDoctorsForAvailabilityConsultation = async (token, date) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  let raw = JSON.stringify({ date: date })
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTATION_DOCTORS_FOR_AVAILABILITY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDoctorsForAvailabilityTreatment = async (token, date) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  let raw = JSON.stringify({ date: date })
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_DOCTORS_FOR_AVAILABILITY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAvailableConsultationSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTATION_AVAILABLE_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAvailableTreatmentSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_AVAILABLE_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getAppointmentsById = async (token, type, id) => {
  // console.log(`getAppointmentsById`, token, type, id)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_BY_ID}/${id}?type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllAppointmentsByDate = async (token, date, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_APPOINTMENTS_BY_DATE}/${date}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  // console.log('response####', response)
  return response.json()
}

export const changeAppointmentStatus = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CHANGE_APPOINTMENT_STAGE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAppointmentsForDoctor = async (token, date) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_BY_DATE}/${date}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentStatus = async (token, visitId, treatmentType) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_STATUS}?visitId=${visitId}&treatmentType=${treatmentType}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentTemplate = async (token, treatmentStartDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DEFAULT_TREATMENT_SHEET}/${treatmentStartDate}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const updateTreatmentStatus = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_STATUS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const updateTreatmentSheetByTreatmentCycleId = async (
  token,
  payload,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_SHEET_BY_TREATMENT_CYCLE_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentSheetByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_SHEET_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientInformationForDoctor = async (
  token,
  patientId,
  appointmentId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_INFORMATION_FOR_DOCTOR}/${patientId}?appointmentId=${appointmentId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAppointmentsHistory = async (token, type, id, date) => {
  // type: Consultation | Treatment
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_HISTORY}?type=${type}&id=${id}&date=${date}`,

    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLineBills = async (token, type, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LINE_BILLS}?createType=${type}&appointmentId=${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLineBills = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LINE_BILLS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getLineBillsAndNotesForAppointment = async (
  token,
  type,
  appointmentId,
) => {
  // type: Consultation | Treatment
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LINEBILLS_AND_NOTES_FOR_APPOINTMENT}?createType=${type}&appointmentId=${appointmentId}`,

    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLineBillsAndNotes = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LINEBILLS_AND_NOTES_FOR_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBillTypeValuesByBillTypeId = (token, billTypeId, branchId) => {
  // type: Consultation | Treatment
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  return fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BILLTYPE_VALUES}/${billTypeId}?branchId=${branchId}`,

    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
}
export const getAllLabTestsByDate = async (token, date, category, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LABTESTS_BY_DATE}/${date}?labCategoryType=${category}&branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getAllLabTests = async (token, fromDate, toDate, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_LAB_TESTS}?fromDate=${fromDate}&&toDate=${toDate}&&branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLabTestsTemplate = async (
  token,
  labTestId,
  appointmentId,
  type,
  isSpouse,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LABTEST_TEMPLATE}?id=${labTestId}&&appointmentId=${appointmentId}&&type=${type}&isSpouse=${isSpouse}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLabTestResult = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LABTEST_RESULT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const saveOutsourcingLabTestResult = async (token, formData) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_OUTSOURCING_LABTEST_RESULT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteOutsourcingLabTestResult = async (
  token,
  labTestResultId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_OUTSOURCING_LABTEST_RESULT}/${labTestResultId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getSavedLabTestResult = async (
  token,
  type,
  appointmentId,
  labTestId,
  isSpouse,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SAVED_LABTEST_RESULT}?type=${type}&appointmentId=${appointmentId}&labTestId=${labTestId}&isSpouse=${isSpouse}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLabTestsFields = async (token, labtestId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LABTESTS_FIELDS}/${labtestId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLabTestFieldValue = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LABTEST_FIELD_VALUES}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getSavedLabTestValues = async (
  token,
  type,
  appointmentId,
  labTestId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SAVED_LABTEST_VALUES}?type=${type}&appointmentId=${appointmentId}&labTestId=${labTestId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getProfileDetails = async (token) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PROFILE_DETAILS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateUserProfile = async (token, payload) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_USER_PROFILE}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTaxCategories = async (token, payload) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TAX_CATEGORIES}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createPharmacyMasterData = async (token, payload, url) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const editPharmacyMasterData = async (token, payload, url) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
    {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow',
      body: JSON.stringify(payload),
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPharmacyMasterData = async (token, url) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPharmacyDetailsByDate = async (token, date, branch) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PHARMACYITEMS_BY_DATE}?date=${date}&&branch=${branch}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const savePharmacyItems = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_PHARMACYITEMS}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getReportsByDate = async (token, fromDate, toDate, branch) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_REPORT_BY_DATE}/?fromDate=${fromDate}&&toDate=${toDate}&&branchId=${branch}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getItemSuggestionGRN = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ITEM_SUGESSIONS}${searchValue}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveGrnDetails = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_GRN_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllGrnData = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_GRN_DATA}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getGrnDataById = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_GRN_BY_ID}/${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getGRNReturnedHistory = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_GRN_HISTORY_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const saveGrnReturn = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_GRN_ITEMS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOrderId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ORDER_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const savePaymentBreakup = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PAYMENT_BREAKUP}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const sendTransactionId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `
    ${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SEND_TRANSACTION_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getStockExpiryReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_STOCK_EXPIRY_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getPrescribedPurchaseReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PRESCRIBED_PURCHASE_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getGrnVendorPaymentsReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_GRN_VENDOR_PAYMENTS_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const download_lab_reports = async (token, payload) => {
  //POST CALL
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_LAB_REPORTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const Generate_Invoice = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GENERATE_INVOICE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SaleReturnInfo = async (token, orderId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SALE_RETURN}/${orderId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getPurchaseReturnInfo = async (token, orderId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PURCHASE_RETURN}/${orderId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const returnPurchasedItems = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_PURCHASED_ITEMS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getFormFReportByDateRange = async (token, fromDate, toDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF_REPORT_BY_DATE_RANGE}?fromDate=${fromDate}&&toDate=${toDate}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDailyReportSummary = async (token, { date, branchId }) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DAILY_REPORT_SUMMARY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        date,
        branchId: Number(branchId) || branchId,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SalesReportDashboard = async (
  token,
  fromDate,
  toDate,
  branchId,
  paymentMode, // optional: 'CASH'|'UPI' or undefined for all
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SALES_REPORT_DASHBOARD}`,
  )
  url.searchParams.append('fromDate', fromDate)
  url.searchParams.append('toDate', toDate)
  url.searchParams.append('branchId', branchId)
  if (paymentMode) url.searchParams.append('paymentMode', paymentMode)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })

  const data = await response.json()

  // Handle 403 Forbidden response (unauthorized access)
  if (response.status === 403) {
    throw new Error('Access restricted. Authorized users only.')
  }

  // Handle other error statuses
  if (!response.ok && response.status !== 403) {
    throw new Error(data.message || 'Failed to fetch revenue data')
  }

  return data
}
export const ReturnItems = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_PHARMACY_ITEMS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getScanByDate = async (token, date, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCAN_BY_DATE}${date}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getSavedScanResults = async (
  token,
  type,
  appointmentId,
  scanId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCAN_RRESULT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getScanTemplate = async (token, scanId, appointmentId, type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCAN_TEMPLATE}/${scanId}?type=${type}&appointmentId=${appointmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const SaveScanResult = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_SCAN_RESULT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getFormFTemplate = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
} //SAVE_GRN_PAYMENTS

export const saveGrnPayments = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_GRN_PAYMENTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//GRN_SALES_REPORT

export const grnSalesReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_SALES_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//GRN_STOCK_REPORT

export const grnStockReport = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_STOCK_REPORT}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// GET_OT_LIST

export const getOtList = async (token, fromDate, toDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const queryParams = toDate
    ? `fromDate=${fromDate}&toDate=${toDate}`
    : `fromDate=${fromDate}`
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OT_LIST}?${queryParams}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getInjectionSheetList = async (token, fromDate, toDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const queryParams = toDate
    ? `fromDate=${fromDate}&toDate=${toDate}`
    : `fromDate=${fromDate}`
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INJECTION_LIST}?${queryParams}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPersonSuggestion = async (token, payload) => {
  console.log(payload)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PERSONS_SUGGESTIONS}`,
    {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow',
      body: JSON.stringify(payload),
      credentials: 'include',
    },
  )
  return response.json()
}
export const getInjectionSuggestionList = async (token, itemName) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INJECTION_SUGGESTION_LIST}?itemName=${itemName}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewOT = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_OT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
// save changes
export const saveOTChanges = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_OT_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//addd new injection
export const addNewInjection = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_INJECTION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const saveInjectionChanges = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_INJECTION_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//get expences
export const getExpenses = async (token, filters = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  // Build query string from filters
  const queryParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Convert date objects to strings if needed
      if (value instanceof Date) {
        queryParams.append(key, dayjs(value).format('DD-MM-YYYY'))
      } else {
        queryParams.append(key, value.toString())
      }
    }
  })

  const queryString = queryParams.toString()
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EXPENSES}${queryString ? `?${queryString}` : ''}`

  console.log('API Call - URL:', url)
  console.log('API Call - Filters:', filters)
  console.log('API Call - Query String:', queryString)

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}
//post call for add expense

export const addExpense = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_EXPENSE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: payload,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editExpense = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_EXPENSE}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: payload,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOTDropdowns = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OT_DROPDOWNS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getSubCategoryListByCategoryId = async (token, catId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SUBCATEGORIES_BY_CATEGORY}/${catId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//add sub categories by category id

export const addSubCategoryByCategoryId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_SUBCATEGORIES_BY_CATEGORY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//edit sub categories post call

export const editSubCategoryByCategoryId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_SUBCATEGORIES_BY_CATEGORY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//delete subcategory by category id
export const deleteSubCategoryByCategoryId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_SUBCATEGORIES_BY_CATEGORY}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentsData = async (token, date) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENTS_DATA}/${date}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//GET_Embryology_Data_By_TreamentCycle_ID

export const getEmbryologyDataByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_Embryology_Data_By_TreamentCycle_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getEmbryologyDefaultTemplateData = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_TEMPLATEBY_ID}/${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientsListEmbryology = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Authorization', `Bearer ${token}`)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_LIST_OF_PATIENTS}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//GET_TEMPLATE_BASED_ON_TREATMENT_ID

export const getTemplateBasedOnTreatmentId = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TEMPLATE_BASED_ON_TREATMENT_ID}/${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//EDIT EMBRYOLOGY

//Vitals
export const getVitalsDetails = async (token, appointmentId, Type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VITALS_DETAILS}?appointmentId=${appointmentId}&type=${Type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editVitalsDetails = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_VITALS_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createVitalsDetails = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_VITALS_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//Treatment Payment
export const getOrderIdTreatment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ORDER_ID_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const sendTransactionDetailsTreatment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SEND_TRANSACTION_DETAILS_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getChecklistByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CHECKLIST_BY_PATIENT_ID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getConsentFormsList = async (token, type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSENT_FORMS_LIST}?type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getFormFTemplatesByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF_HISTORY_BY_PATIENTID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getFormFTemplatesByScanAppointment = async (
  token,
  appointmentId,
  scanId,
  type,
) => {
  console.log('check entered')
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF_HISTORY_BY_SCAN_APPOINTMENT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const reviewFormFForScanAppointment = async (
  token,
  appointmentId,
  scanId,
  type,
  payload,
) => {
  console.log('check entered')
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_FORMF_FOR_SCAN_APPOINTMENT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadConsentFormById = async (token, id, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_CONSENT_FORM_BY_ID}?id=${id}&&patientId=${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
  // downloadPDF(response)
  return response
}

export const downloadSampleFormF = async (
  token,
  appointmentId,
  scanId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_SAMPLE_FORMF}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
  // downloadPDF(response)
  return response
}

export const getIcsiConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ICSI_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export async function downloadPDF(response) {
  // const response = await fetch('/your-api-endpoint'); // Replace with your actual endpoint
  console.log('response', response)

  if (response.ok) {
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    const fileName = response.headers
      .get('Content-Disposition')
      ?.split('filename=')[1]
    // console.log(response.url.split('patientId=')[1])
    link.download = fileName // Extract filename from header
    link.click()

    window.URL.revokeObjectURL(url)
  } else {
    // Handle error, e.g., display an error message to the user
    console.error('Error downloading PDF:', response.statusText)
  }
}

export const uploadIcsiConsentForm = async (
  token,
  visitId,
  file,
  patientId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('icsiConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_ICSI_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteIcsiConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ICSI_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const reviewIcsiConsents = async (token, visitId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_ICSI_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      body: JSON.stringify(payload),
      credentials: 'include',
    },
  )
  return response.json()
}

export const reviewIuiConsents = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_IUI_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getFETConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FET_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadFETConsentForm = async (token, visitId, file, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('fetConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_FET_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteFETConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_FET_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const reviewFETConsents = async (token, visitId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_FET_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const reviewEraConsents = async (token, visitId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_ERA_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getEraConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ERA_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadEraConsentForm = async (token, visitId, file, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('eraConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_ERA_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const deleteEraConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ERA_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getIuiConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_IUI_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const uploadIuiConsentForm = async (token, visitId, file, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('iuiConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_IUI_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteIuiConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_IUI_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
}

export const uploadFormFForm = async (
  token,
  appointmentId,
  file,
  scanId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('appointmentId', appointmentId)
  formData.append('formF', file)
  formData.append('scanId', scanId)
  formData.append('type', type)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_FORMF_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteFormFForm = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_FORMF_FORM}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const updateTreatmentFETSheetByTreatmentCycleId = async (
  token,
  payload,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_FET_SHEET_BY_TREATMENT_CYCLE_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getTreatmentFETSheetByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_FET_SHEET_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOpdSheetTemplate = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OPD_SHEET_TEMPLATE}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateOpdSheetTemplate = async (token, patientId, template) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_OPD_SHEET}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        patientId: patientId,
        template: template,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDischargeSummaryTemplate = async (token, TreatmentCycleId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DISCHARGE_SUMMARY_TEMPLATE}/${TreatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateDischargeSummaryTemplate = async (
  token,
  treatmentCycleId,
  template,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_DISCHARGE_SUMMARY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        treatmentCycleId: treatmentCycleId,
        template: template,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPickupSheetTemplate = async (token, TreatmentCycleId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PICKUP_SHEET_TEMPLATE}/${TreatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updatePickupSheetTemplate = async (
  token,
  treatmentCycleId,
  template,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_PICKUP_SHEET}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        treatmentCycleId: treatmentCycleId,
        template: template,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const applyPackageDiscount = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_PACKAGE_DISCOUNT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getCoupons = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_COUPONS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const bookReviewTreatmentCall = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_REVIEW_TREATMENT_CALL}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyDataByConsultation = async (
  token,
  consultationId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_DATA_BY_CONSULTATION}/${consultationId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyDataByTreatment = async (token, treatmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_DATA_BY_TREATMENT}/${treatmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyTemplateById = async (
  token,
  id,
  appointmentId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_TEMPLATE_BY_ID}?id=${id}&appointmentId=${appointmentId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SaveEmbryologyTreatment = async (token, payload) => {
  //save embryology treatment data
  const myHeaders = new Headers()
  const formData = new FormData()
  console.log(payload)

  Object.keys(payload).forEach((key) => {
    if (key != 'imageLink' && key != 'embryologyImage') {
      if (typeof payload[key] === 'object') {
        formData.append(key, JSON.stringify(payload[key]))
      } else {
        formData.append(key, payload[key])
      }
    }
  })

  if (Array.isArray(payload.embryologyImage)) {
    payload.embryologyImage.forEach((image, idx) => {
      // If image is a File/Blob, append directly; otherwise, skip or handle as needed
      if (image) {
        formData.append('embryologyImage', image)
      }
    })
  }
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_EMBRYOLOGY_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SaveEmbryologyConsultation = async (token, payload, file) => {
  const myHeaders = new Headers()
  const formData = new FormData()
  Object.keys(payload).forEach((key) => {
    if (key != 'imageLink' && key != 'embryologyImage') {
      formData.append(key, payload[key])
    }
  })
  if (Array.isArray(payload.embryologyImage)) {
    payload.embryologyImage.forEach((image, idx) => {
      // If image is a File/Blob, append directly; otherwise, skip or handle as needed
      if (image) {
        formData.append('embryologyImage', image)
      }
    })
  }
  myHeaders.append('Authorization', `Bearer ${token}`)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_EMBRYOLOGY_CONSULTATION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editEmbryologyTreatment = async (token, payload, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const formData = new FormData()
  console.log(payload, id)
  Object.keys(payload).forEach((key) => {
    if (key !== 'imageLink' && key !== 'embryologyImage') {
      if (typeof payload[key] === 'object') {
        formData.append(key, JSON.stringify(payload[key]))
      } else {
        formData.append(key, payload[key])
      }
    }
  })

  // Handle embryologyImage as an array of multiple images
  if (Array.isArray(payload.embryologyImage)) {
    payload.embryologyImage.forEach((image, idx) => {
      // If image is a File/Blob, append directly; otherwise, skip or handle as needed
      if (image) {
        formData.append('embryologyImage', image)
      }
    })
  }

  console.log(formData)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_EMBROYOLOGY_TREAMENT}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editEmbryologyConsultation = async (token, payload, id) => {
  //edit embryology consultation data
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  Object.keys(payload).forEach((key) => {
    if (key != 'imageLink' && key != 'embryologyImage') {
      formData.append(key, payload[key])
    }
  })

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_EMBROYOLOGY_CONSULTATION}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyHistoryByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_HISTORY_BY_PATIENT_ID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientVisits = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_VISITS}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getConsultationsHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTATIONS_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentsHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENTS_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getNotesHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_NOTES_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_APPOINTMENT}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const applyNoShow = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_NO_SHOW}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPrescriptionDetailsByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PRESCRIPTION_DETAILS_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPaymentHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PAYMENT_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllAppointmentReasons = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_APPOINTMENT_REASONS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewAppointmentReason = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_APPOINTMENT_REASON}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// export const editAppointmentReason = async (token, payload, id) => {
//   const myHeaders = new Headers()
//   myHeaders.append('Authorization', `Bearer ${token}`)
//   myHeaders.append('Content-Type', 'application/json')

//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_APPOINTMENT_REASON}/${id}`,
//     {
//       method: 'PUT',
//       headers: myHeaders,
//       body: JSON.stringify(payload),
//     },
//   )
// }

export const deleteAppointmentReason = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_APPOINTMENT_REASON}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
    },
  )
}

export const closeVisitInTreatment = async (token, payload, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_VISIT_IN_TREATMENT}/${visitId}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const closeVisitInConsultation = async (token, payload, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_VISIT_IN_CONSULTATION}/${visitId}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const noShowReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.NOSHOW_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getItemPurchaseHistoryReport = async (token, itemId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ITEM_PURCHASE_HISTORY_REPORT}/${itemId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllIncidents = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INCIDENT_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getUserSuggestion = async (token, searchQuery) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_USER_SUGGESTION}?searchQuery=`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewIncident = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_INCIDENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editIncident = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_INCIDENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllOrders = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ORDERS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const createNewOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_ORDER}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const placeOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PLACE_ORDER}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const payOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PAY_ORDER}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const receiveOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const formData = new FormData()
  formData.append('orderId', payload?.orderId)
  formData.append('receivedDate', payload?.receivedDate?.format('YYYY-MM-DD'))
  formData.append('orderInvoice', payload?.invoiceFile)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RECEIVE_ORDER}`,
    {
      method: 'PUT',
      body: formData,
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllDepartments = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DEPARTMENTS_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllVendors = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VENDORS_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllVendorsByDepartmentId = async (token, departmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VENDORS_LIST_BY_DEPARTMENTID}/${departmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllSupplies = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SUPPLIES_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllSuppliesByDepartmentId = async (token, departmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SUPPLIES_LIST_BY_DEPARTMENT}/${departmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getHysteroscopySheetByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_HYSTEROSCOPY_SHEET_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const updateHysteroscopySheetByVisitId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_HYSTEROSCOPY_SHEET_BY_VISIT_ID}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAppointmentsByPatient = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_BY_PATIENT}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const applyMarkAsSeenForDoctorAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_MARK_AS_SEEN_FOR_DOCTOR_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllOutsourcingLabTests = async (token, searchQuery) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_OUTSOURCING_LAB_TESTS}?searchQuery=${searchQuery}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const printPrescription = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PRINT_PRESCRIPTION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllTasks = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_TASKS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getTaskDetailsByTaskId = async (taskId, token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TASK_DETAILS}/${taskId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const createTaskComment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_TASK_COMMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPendingInformation = async (token, appointmentId, type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PENDING_INFORMATION}?appointmentId=${appointmentId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createNewTask = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_NEW_TASK}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editTask = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_TASK}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const applyOptOut = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_OPT_OUT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentCyclesReport = async (
  token,
  startDate,
  endDate,
  branchId,
  searchQuery,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.TREATMENT_CYCLES_REPORT}?fromDate=${startDate}&&toDate=${endDate}&&branchId=${branchId}&&searchQuery=${searchQuery}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const treatmentCyclesPaymentsReport = async (
  token,
  startDate,
  endDate,
  branchId,
  searchQuery,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PATIENT_MILESTONES_REPORT}?fromDate=${startDate}&&toDate=${endDate}&&branchId=${branchId}&&searchQuery=${searchQuery}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createOtherAppointmentReason = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_OTHER_APPOINTMENT_REASON}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createAlert = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_ALERT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllAlerts = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_ALERTS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editAlert = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_ALERT}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteAlert = async (token, alertId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ALERT}/${alertId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllActiveVisitAppointments = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_ACTIVE_VISIT_APPOINTMENTS}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteReceipt = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_RECEIPT}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAvailableGrnInfoByItemId = async (
  token,
  itemId,
  type,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_AVAILABLE_GRN_INFO_BY_ITEM_ID}?id=${itemId}&type=${type}&branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getConsultantRoasters = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTANT_ROASTERS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addConsultantRoaster = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_CONSULTANT_ROASTER}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editConsultantRoaster = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_CONSULTANT_ROASTER}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const downloadEmbryologyReport = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  console.log('payload-in', payload)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_EMBRYOLOGY_REPORT}?type=${payload?.type}&id=${payload?.id}&categoryType=${payload?.categoryType}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
}
export const downloadEmbryologyImagesReport = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_EMBRYOLOGY_IMAGES_REPORT}?type=${payload?.type}&id=${payload?.id}&categoryType=${payload?.categoryType}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
  return response.json()
}

export const getTreatmentERASheetByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_ERA_SHEET_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateTreatmentERASheetByTreatmentCycleId = async (
  token,
  payload,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_ERA_SHEET_BY_TREATMENT_CYCLE_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteTaskImage = async (token, imageId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_TASK_IMAGE}/${imageId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadTaskImage = async (token, formData, taskId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_TASK_IMAGE}/${taskId}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOtherPaymentsStatus = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OTHER_PAYMENTS_STATUS}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOtherPaymentsOrderId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OTHER_PAYMENTS_ORDER_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const sendOtherPaymentsTransactionId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SEND_OTHER_PAYMENTS_TRANSACTION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addOtherPayment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_OTHER_PAYMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const downloadOPDSheet = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_OPD_SHEET}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadScanReport = async (
  token,
  appointmentId,
  scanId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_SCAN_REPORT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadLabReport = async (
  token,
  appointmentId,
  labTestId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_LAB_REPORT}?appointmentId=${appointmentId}&labTestId=${labTestId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadOtherPaymentsInvoice = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_OTHER_PAYMENTS_INVOICE}?refId=${payload.refId}&patientId=${payload.patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadEmbryologyImage = async (token, formData) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_EMBRYOLOGY_IMAGE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteEmbryologyImage = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_EMBRYOLOGY_IMAGE}`,
    {
      method: 'DELETE',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getIndentList = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INDENT_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewIndent = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_INDENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBuildings = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BUILDINGS}/${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getFloors = async (token, buildingId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FLOORS}/${buildingId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getRooms = async (token, floorId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ROOMS}/${floorId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBeds = async (token, roomId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BEDS}/${roomId}  `,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getActiveIP = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ACTIVE_IP}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getClosedIP = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CLOSED_IP}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createIPRegistration = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_IP_REGISTRATION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const closeIpRegistration = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_IP_REGISTRATION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const registerBuildingStructure = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REGISTER_BUILDING}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLayoutOverview = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LAYOUT_OVERVIEW}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBedDetails = async (token, bedId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BED_DETAILS}/${bedId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
