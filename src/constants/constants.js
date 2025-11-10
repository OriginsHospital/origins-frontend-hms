import { Add } from '@mui/icons-material'
import { PAGE_TYPES } from 'next/dist/lib/page-types'

export const API_ROUTES = {
  LOGIN: '/auth/loginWithEmail',
  FORGOT_PASSWORD: '/auth/forgotPassword',
  CHANGE_PASSWORD: '/auth/changePassword',
  SEND_OTP: '/auth/sendOtp',
  VERIFY_OTP: '/auth/verifyOtp',
  RESET_PASSWORD: '/auth/resetPassword',
  LOGGED_USER_INFO: '/auth/getUserInfo',
  GET_NEW_ACCESS_TOKEN: '/auth/getNewAccessToken',
  LOGOUT: '/auth/logout',
  USERS_LIST: '/users/getUsersList',
  GET_VALID_USERS: '/users/getValidUsersList',
  GET_USER_DETAILS: '/users/getUserDetails',
  VALIDATE_USER: '/users/updateUserDetails',
  GET_ROLES: '/roles/getRoles',
  GET_ROLE_DETAIL: '/roles/getRoleDetails',
  GET_BRANCHES: '/branches/getBranches',
  GET_MODULES: '/modules/getModules',
  GET_PATIENTS: '/patients/getPatients',
  GET_PATIENT_TREATMENTCYCLES: '/patients/getPatientTreatmentCycles',
  GET_DONAR_INFORMATION: '/visits/getDonarInformation',
  GET_DONAR_DATA_BY_VISIT: '/visits/getDonarDataByVisitId',
  SAVE_DONAR_RECORD: '/visits/saveDonar',
  EDIT_DONAR_RECORD: '/visits/editDonar',
  DELET_DONOR_FILE: '/visits/deleteDonorFile',
  GET_DROPDOWNS: '/api/dropdownOptions',
  GET_CITIES: '/api/getCities/',
  GET_TREATMENT_TYPES: '/api/getTreatmentTypes',
  GET_PATIENTS_BY_AADHAAR_OR_MOBILE: '/patients/searchPatient',
  CREATE_PATIENT_RECORD: '/patients/createPatient',
  CREATE_GUARDIAN_RECORD: '/patients/createGuardian',
  EDIT_PATIENT_RECORD: '/patients/editPatient',
  CREATE_GUARDIAN_RECORD: '/patients/createGuardian',
  EDIT_GUARDIAN_RECORD: '/patients/editguardian',
  GET_VISIT_BY_PATIENTID: '/visits/getVisits',
  CREATE_VISIT: '/visits/createVisit',
  GET_DOCTORS_LIST: '/slots/getDoctorsList',
  SAVE_BLOCKED_TIME_SLOTS: '/slots/saveBlockedTimeSlots',
  GET_BLOCKED_TIME_SLOTS: '/slots/getBlockedTimeSlots',
  SAVE_DOCTOR_AVAILABILITY: '/doctors/saveDoctorAvailability',
  GET_DOCTORS_FOR_AVAILABILITY: '/doctors/getDoctorsForAvailability',
  GET_VISIT_INFO: '/visits/getVisitInfo',
  CREATE_CONSULTATION_OR_TREATMENT: '/visits/createConsultationOrTreatment',
  GET_PACKAGE_DATA: '/visits/getPackages',
  CREATE_PACKAGE: '/visits/createPackage',
  EDIT_PACKAGE: '/visits/editPackage',
  APPLY_PACKAGE_DISCOUNT: '/visits/applyDiscountForPackage',
  GET_CONSULTATION_DOCTORS_FOR_AVAILABILITY:
    '/consultation/getAvailableDoctors',
  GET_CONSULTATION_AVAILABLE_SLOTS: '/consultation/getAvailableSlots',
  BOOK_CONSULTATION_APPOINTMENT: '/consultation/bookAppointment',
  BOOK_REVIEW_CALL_CONSULTATION_APPOINTMENT:
    '/consultation/bookReviewAppointment',
  GET_CHECKLIST_BY_PATIENT_ID: '/doctors/getCheckListSheetByPatientId',

  GET_TREATMENT_DOCTORS_FOR_AVAILABILITY: '/treatment/getAvailableDoctors',
  GET_TREATMENT_AVAILABLE_SLOTS: '/treatment/getAvailableSlots',
  BOOK_TREATMENT_APPOINTMENT: '/treatment/bookAppointment',

  GET_TREATMENT_STATUS: '/treatment/getTreatmentStatus',
  UPDATE_TREATMENT_STATUS: '/treatment/updateTreatmentStatus',
  GET_DEFAULT_TREATMENT_SHEET: '/treatment/getTreatmentSheets',
  UPDATE_TREATMENT_SHEET_BY_TREATMENT_CYCLE_ID:
    '/treatment/updateTreatmentSheetByTreatmentCycleId',
  GET_TREATMENT_SHEET_BY_TREATMENT_CYCLE_ID:
    '/treatment/getTreatmentSheetsByTreatmentCycleId',

  GET_APPOINTMENTS_BY_ID: '/appointments/getAppointmentsById',
  EDIT_APPOINTMENT: '/appointments/rescheduleAppointment',
  GET_ALL_APPOINTMENTS_BY_DATE: '/appointments/getAppointmentsByDate',
  CHANGE_APPOINTMENT_STAGE: '/appointments/changeAppointmentStatus',
  GET_LINE_BILLS: '/appointments/getLineBills',
  SAVE_LINE_BILLS: '/appointments//appointments/saveLineBills',
  GET_APPOINTMENTS_REASONS_LIST: '/appointments/getAppointmentReasons',
  GET_APPOINTMENT_REASONS_BY_PATIENT_TYPE:
    '/appointments/getAppointmentReasonsByPatientType',

  GET_APPOINTMENTS_BY_DATE: '/doctors/getAppointmentsByDate',
  GET_PATIENT_INFORMATION_FOR_DOCTOR: '/doctors/getPatientInformation',
  GET_APPOINTMENTS_HISTORY: '/doctors/getAppointmentHistory',
  GET_LINEBILLS_AND_NOTES_FOR_APPOINTMENT:
    '/doctors/getLineBillsAndNotesForAppointment',
  SAVE_LINEBILLS_AND_NOTES_FOR_APPOINTMENT:
    '/doctors/createLineBillsAndNotesForAppointment',
  GET_BILLTYPE_VALUES: '/api/getBillTypeValues',
  GET_LABTESTS_BY_DATE: '/labs/getLabtestsByDate',
  GET_LABTEST_TEMPLATE: '/labs/getLabTestTemplate',
  SAVE_LABTEST_RESULT: '/labs/saveLabTestResult',
  GET_SAVED_LABTEST_RESULT: '/labs/getSavedLabTestResult',
  DOWNLOAD_LAB_REPORT: '/labs/downloadLabReport',

  SAVE_OUTSOURCING_LABTEST_RESULT: '/labs/saveOutsourcingLabTestResult',
  DELETE_OUTSOURCING_LABTEST_RESULT: '/labs/deleteLabOursourcingTestResult',

  GET_LABTESTS_FIELDS: '/labs/labTest/getFields',
  SAVE_LABTEST_FIELD_VALUES: '/labs/saveLabTestFieldValues',
  GET_SAVED_LABTEST_VALUES: '/labs/getSavedLabTestValues',
  GET_PROFILE_DETAILS: '/users/getUserProfileInfo',
  UPDATE_USER_PROFILE: '/users/updateUserProfile',

  //Vitals
  GET_VITALS_DETAILS: '/vitals/getVitalsDetails',
  EDIT_VITALS_DETAILS: '/vitals/editVitalsDetails',
  CREATE_VITALS_DETAILS: '/vitals/saveVitalsDetails',

  GET_TAX_CATEGORIES: '/pharmacy/master/getTaxCategory',
  CREATE_TAX_CATEGORIES: '/pharmacy/master/createTaxCategory',
  EDIT_TAX_CATEGORIES: '/pharmacy/master/editTaxCategory',

  //paths for invertory
  GET_INVENTORY_TYPE: '/pharmacy/master/getInventoryType',
  CREATE_INVENTORY_TYPE: '/pharmacy/master/createInventoryType',
  EDIT_INVENTORY_TYPE: '/pharmacy/master/editInventoryType',
  GET_SUPPLIERS: '/pharmacy/master/getSupplier',
  CREATE_SUPPLIERS: '/pharmacy/master/createSupplier',
  EDIT_SUPPLIERS: '/pharmacy/master/editSupplier',
  GET_MANUFACTURER: '/pharmacy/master/getManufacturer',
  CREATE_MANUFACTURER: '/pharmacy/master/createManufacturer',
  EDIT_MANUFACTURER: '/pharmacy/master/editManufacturer',

  GET_MANUFACTURER: '/pharmacy/master/getManufacturer',

  GET_ALL_PERSONS_LIST: '/op/getAllPersonsList',
  CREATE_PERSON: '/op/savePersonDetails',
  EDIT_PERSON: '/op/editPersonDetails',

  //Paths for Pharmacy details
  GET_PHARMACYITEMS_BY_DATE: '/pharmacy/getPharmacyDetailsByDate',
  SAVE_PHARMACYITEMS: '/pharmacy/updatePharmacyDetails',
  GET_PAYMENT_BREAKUP: '/pharmacy/generatePaymentBreakUp',

  GET_ITEM_SUGESSIONS: '/pharmacy/getItemSuggestion/',
  GET_ALL_GRN_DATA: '/pharmacy/getGrnList',
  GET_GRN_BY_ID: '/pharmacy/getGrnDetails',
  SAVE_GRN_DETAILS: '/pharmacy/saveGrnDetails',
  RETURN_GRN_HISTORY_LIST: '/pharmacy/getGrnItemsReturnHistory',
  RETURN_GRN_ITEMS: '/pharmacy/returnGrnItems',
  //Path for reports
  GET_REPORT_BY_DATE: '/reports/appointmentStageDurationReport',
  GET_STOCK_EXPIRY_REPORT: '/reports/stockExpiryReport',
  GET_PRESCRIBED_PURCHASE_REPORT: '/reports/prescribedPurchaseReport',
  GET_GRN_VENDOR_PAYMENTS_REPORT: '/reports/getGrnVendorPaymentsReport',
  GET_FORMF: '/patients/getFormFTemplate',

  GET_ORDER_ID: '/payment/getOrderId',
  GET_PAYMENT_BREAKUP: '/pharmacy/generatePaymentBreakUp',
  SEND_TRANSACTION_DETAILS: '/payment/sendTransactionId',
  SAVE_GRN_PAYMENTS: '/pharmacy/saveGrnPayments',

  GET_ORDER_ID_TREATMENT: '/treatmentPayment/getOrderId',
  SEND_TRANSACTION_DETAILS_TREATMENT: '/treatmentPayment/sendTransaction',

  DOWNLOAD_LAB_REPORTS: '/labs/downloadLabReport',
  GENERATE_INVOICE: '/payment/generateInvoice',
  SALE_RETURN: '/payment/getSaleReturnInformation',
  GET_PURCHASE_RETURN: '/payment/getPurchaseReturnInformation',
  RETURN_PURCHASED_ITEMS: '/payment/returnPurchasedItems',
  SALES_REPORT_DASHBOARD: '/reports/salesReport',
  RETURN_PHARMACY_ITEMS: '/payment/returnPharmacyItems',
  //Sacn module
  GET_SCAN_BY_DATE: '/scan/getScansByDate/',
  GET_SCAN_RRESULT: '/scan/getSavedScanResult',
  GET_SCAN_TEMPLATE: '/scan/getScanTemplate',
  SAVE_SCAN_RESULT: '/scan/saveScanResult',
  DOWNLOAD_SCAN_REPORT: '/scan/downloadScanReport',

  GRN_SALES_REPORT: '/reports/grnSalesReport',
  GRN_STOCK_REPORT: '/reports/stockReport',
  NOSHOW_REPORT: '/reports/noShowReport',

  GET_OT_LIST: '/op/getOtList',
  ADD_NEW_OT: '/op/saveOTDetails',
  EDIT_OT_DETAILS: '/op/editOtDetails',
  GET_INJECTION_LIST: '/op/getInjectionList',
  ADD_NEW_INJECTION: '/op/saveInjectionDetails',
  EDIT_INJECTION_DETAILS: '/op/editInjectionDetails',
  GET_PERSONS_SUGGESTIONS: '/op/getPersonSuggestion',
  GET_INJECTION_SUGGESTION_LIST: '/op/getInjectionSuggestionList',

  GET_EXPENSES: '/expenses/getAllExpenses',
  ADD_NEW_EXPENSE: '/expenses/saveExpense',
  UPDATE_EXPENSE: '/expenses/editExpense',

  GET_OT_DROPDOWNS: '/op/getAllPersonsListDesignationWise',
  GET_SUBCATEGORIES_BY_CATEGORY: '/expenses/getSubCategoryListByCategoryId',
  ADD_SUBCATEGORIES_BY_CATEGORY: '/expenses/saveSubCategory',
  EDIT_SUBCATEGORIES_BY_CATEGORY: '/expenses/editSubCategory',
  DELETE_SUBCATEGORIES_BY_CATEGORY: '/expenses/deleteSubCategory',
  GET_TREATMENTS_DATA: '/embryology/getPatientListByTreatmentDate',
  GET_Embryology_Data_By_TreamentCycle_ID:
    '/embryology/getEmbryologyDataByTreamentCycleId',

  GET_TEMPLATE_BASED_ON_TREATMENT_ID: '/embryology/getEmbryologyTemplateById',

  GET_EMBRYOLOGY_LIST_OF_PATIENTS: '/embryology/getPatientListForEmbryology',
  GET_EMBRYOLOGY_TEMPLATEBY_ID: 'getEmbryologyTemplateById',

  GET_CONSENT_FORMS_LIST: '/consentFormTemplate/getConsentFormsList',
  GET_FORMF_HISTORY_BY_PATIENTID:
    '/patientHistory/getFormFTemplatesByPatientId',
  GET_FORMF_HISTORY_BY_SCAN_APPOINTMENT:
    '/patientHistory/getFormFTemplatesByScanAppointment',
  REVIEW_FORMF_FOR_SCAN_APPOINTMENT: '/scan/reviewFormFTemplate',
  GET_FORMF_REPORT_BY_DATE_RANGE: '/scan/getFormFTemplateByDateRange',

  DOWNLOAD_CONSENT_FORM_BY_ID: '/consentFormTemplate/downloadConsentFormById',
  GET_ICSI_CONSENTS_BY_VISIT_ID: '/icsi/getIcsiConsentsByVisitId',
  UPLOAD_ICSI_CONSENT_FORM: '/icsi/uploadIcsiConsent',
  DELETE_ICSI_CONSENT_FORM: '/icsi/deleteIcsiConsent',
  REVIEW_ICSI_CONSENTS: '/icsi/reviewIcsiConsents',
  GET_FET_CONSENTS_BY_VISIT_ID: '/fet/getFetConsentsByVisitId',
  UPLOAD_FET_CONSENT_FORM: '/fet/uploadFetConsent',
  DELETE_FET_CONSENT_FORM: '/fet/deleteFetConsent',
  REVIEW_FET_CONSENTS: '/fet/reviewFetConsents',
  // CONSENTS for IUI
  GET_IUI_CONSENTS_BY_VISIT_ID: '/iui/getIuiConsentsByVisitId',
  UPLOAD_IUI_CONSENT_FORM: '/iui/uploadIuiConsent',
  DELETE_IUI_CONSENT_FORM: '/iui/deleteIuiConsent',
  REVIEW_IUI_CONSENTS: '/iui/reviewIuiConsents',

  UPLOAD_FORMF_FORM: '/scan/uploadFormFForScans',
  DELETE_FORMF_FORM: '/scan/deleteFormFForScans',
  DOWNLOAD_SAMPLE_FORMF: '/scan/downloadSampleFormFTemplate',

  UPDATE_TREATMENT_FET_SHEET_BY_TREATMENT_CYCLE_ID:
    '/treatment/updateTreatmentFetSheetByTreatmentCycleId',
  GET_TREATMENT_FET_SHEET_BY_TREATMENT_CYCLE_ID:
    '/treatment/getTreatmentFetSheetByTreatmentCycleId',

  GET_OPD_SHEET_TEMPLATE: '/patients/getOpdSheetByPatientId',
  SAVE_OPD_SHEET: '/patients/saveOpdSheet',
  DOWNLOAD_OPD_SHEET: '/patients/downloadOpdSheetByPatientId',
  GET_DISCHARGE_SUMMARY_TEMPLATE:
    '/patients/getDischargeSummarySheetByTreatmentId',
  SAVE_DISCHARGE_SUMMARY: '/patients/saveDischargeSummarySheet',
  GET_PICKUP_SHEET_TEMPLATE: '/patients/getPickUpSheetByTreatmentId',
  SAVE_PICKUP_SHEET: '/patients/savePickUpSheet',
  //coupons
  GET_COUPONS: '/coupon/getAllCoupons',
  CREATE_COUPON: '/coupon/addCoupon',
  EDIT_COUPON: '/coupon/editCoupon',

  BOOK_REVIEW_TREATMENT_CALL: '/treatment/bookReviewAppointment',
  GET_EMBRYOLOGY_DATA_BY_CONSULTATION:
    '/embryology/getEmbryologyDataByConsultation',
  GET_EMBRYOLOGY_DATA_BY_TREATMENT: '/embryology/getEmbryologyDataByTreament',
  GET_EMBRYOLOGY_TEMPLATE_BY_ID: '/embryology/getEmbryologyTemplateById',

  SAVE_EMBRYOLOGY_CONSULTATION: '/embryology/saveEmbryologyConsultation',
  SAVE_EMBRYOLOGY_TREATMENT: '/embryology/saveEmbryologyTreatment',
  EDIT_EMBROYOLOGY_TREAMENT: '/embryology/editEmbryologyTreatment',
  EDIT_EMBROYOLOGY_CONSULTATION: '/embryology/editEmbryologyConsultation',
  GET_EMBRYOLOGY_HISTORY_BY_PATIENT_ID:
    '/doctors/getEmbryologyHistoryByPatientId',
  GET_PATIENT_VISITS: '/patientHistory/visits',
  GET_EMBRYOLOGY_HISTORY_BY_VISIT_ID: '/patientHistory/embryology',
  GET_CONSULTATIONS_HISTORY_BY_VISIT_ID: '/patientHistory/consultations',
  GET_TREATMENTS_HISTORY_BY_VISIT_ID: '/patientHistory/treatments',
  GET_NOTES_HISTORY_BY_VISIT_ID: '/patientHistory/getNotesHistoryByVisitId',
  DELETE_APPOINTMENT: '/appointments/deleteAppointment',
  APPLY_NO_SHOW: '/appointments/applyNoShow',

  GET_PRESCRIPTION_DETAILS_BY_TREATMENT_CYCLE_ID:
    '/patientHistory/getPrescriptionDetailsByTreatmentCycleIdFollicular',
  GET_PAYMENT_HISTORY_BY_VISIT_ID: '/patientHistory/getPaymentHistoryByVisitId',
  GET_ALL_APPOINTMENT_REASONS:
    '/masterData/appointments/getAllAppointmentReasons',
  ADD_NEW_APPOINTMENT_REASON:
    '/masterData/appointments/addNewAppointmentReason',
  EDIT_APPOINTMENT_REASON: '/masterData/appointments/editAppointmentReason',
  DELETE_APPOINTMENT_REASON: '/masterData/appointments/deleteAppointmentReason',

  GET_ALL_LAB_TEST_GROUPS: '/masterData/labTestGroup/getAllLabTestGroups',
  ADD_NEW_LAB_TEST_GROUP: '/masterData/labTestGroup/addNewLabTestGroup',
  EDIT_LAB_TEST_GROUP: '/masterData/labTestGroup/editLabTestGroup',
  GET_ALL_LAB_TEST_SAMPLE_TYPES:
    '/masterData/labTestSampleType/getAllLabTestSampleTypes',
  ADD_NEW_LAB_TEST_SAMPLE_TYPE:
    '/masterData/labTestSampleType/addNewLabTestSampleType',
  EDIT_LAB_TEST_SAMPLE_TYPE:
    '/masterData/labTestSampleType/editLabTestSampleType',

  GET_ALL_LAB_TESTS_LIST: '/masterData/labTests/getAllLabTestsList',
  ADD_NEW_LAB_TEST: '/masterData/labTests/addNewLabTest',
  EDIT_LAB_TEST: '/masterData/labTests/editLabTest',

  GET_ALL_SCANS_LIST: '/masterData/scans/getAllScansList',
  ADD_NEW_SCAN: '/masterData/scans/addNewScan',
  EDIT_SCAN: '/masterData/scans/editScan',

  GET_ALL_EMBRYOLOGY_LIST: '/masterData/embryology/getAllEmbryologyList',
  ADD_NEW_EMBRYOLOGY: '/masterData/embryology/addNewEmbryology',
  EDIT_EMBRYOLOGY: '/masterData/embryology/editEmbryology',

  CLOSE_VISIT_IN_TREATMENT: '/visits/closeVisit',
  CLOSE_VISIT_IN_CONSULTATION: '/visits/closeVisitByConsultation',
  GET_ALL_PHARMACY_ITEMS: '/masterData/pharmacy/getAllPharmacyItems',
  ADD_NEW_PHARMACY_ITEM: '/masterData/pharmacy/addNewPharmacyItem',
  EDIT_PHARMACY_ITEM: '/masterData/pharmacy/editPharmacyItem',
  GET_ITEM_PURCHASE_HISTORY_REPORT: '/reports/itemPurchaseHistoryReport',
  ADD_NEW_INCIDENT: '/masterData/incident/addNewIncident',
  EDIT_INCIDENT: '/masterData/incident/editIncident',
  GET_INCIDENT_LIST: '/masterData/incident/getAllIncidentsList',

  GET_DEPARTMENTS_LIST: '/masterData/department/getDepartmentsList',
  ADD_NEW_DEPARTMENT: '/masterData/department/addNewDepartment',
  EDIT_DEPARTMENT: '/masterData/department/editDepartment',

  ADD_NEW_VENDOR: '/masterData/vendors/addNewVendor',
  EDIT_VENDOR: '/masterData/vendors/editVendor',
  GET_VENDORS_LIST: '/masterData/vendors/getAllVendorsList',
  GET_VENDORS_LIST_BY_DEPARTMENTID: '/masterData/vendors/getAllVendorsList',

  GET_SUPPLIES_LIST: '/masterData/supplies/getAllSuppliesList',
  GET_SUPPLIES_LIST_BY_DEPARTMENT: '/masterData/supplies/getAllSuppliesList',
  ADD_NEW_SUPPLY: '/masterData/supplies/addNewSupplyItem',
  EDIT_SUPPLY: '/masterData/supplies/editSupplyItem',
  GET_USER_SUGGESTION: '/users/getUserSuggestion',

  GET_HYSTEROSCOPY_SHEET_BY_VISIT_ID:
    '/treatment/getHysteroscopySheetByVisitId',
  UPDATE_HYSTEROSCOPY_SHEET_BY_VISIT_ID:
    '/treatment/updateHysteroscopySheetByVisitId',

  //orders
  GET_ORDERS: '/orders/getAllOrders',
  CREATE_ORDER: '/orders/createOrder',
  PLACE_ORDER: '/orders/placeOrder',
  RECEIVE_ORDER: '/orders/receiveOrder',
  PAY_ORDER: '/orders/paidOrder',

  GET_ALL_REFERRALS: '/masterData/referrals/getAllReferrals',
  ADD_NEW_REFERRAL: '/masterData/referrals/addReferral',
  EDIT_REFERRAL: '/masterData/referrals/editReferral',

  GET_ALL_CITIES: '/masterData/cities/getAllCities',
  ADD_NEW_CITY: '/masterData/cities/addCity',
  EDIT_CITY: '/masterData/cities/editCity',

  GET_APPOINTMENTS_BY_PATIENT: '/doctors/getAppointmentsByPatient',
  APPLY_MARK_AS_SEEN_FOR_DOCTOR_APPOINTMENT:
    '/doctors/setIsCompletedForAppointment',
  GET_ALL_OUTSOURCING_LAB_TESTS: '/labs/getAllOutsourcingLabTests',
  PRINT_PRESCRIPTION: '/printPrescription',
  GET_PENDING_INFORMATION: '/appointments/getPendingInformation',
  GET_ALL_TASKS: '/taskTracker/getAllTasks',
  GET_TASK_DETAILS: '/taskTracker/getTaskDetails',
  CREATE_TASK_COMMENT: '/taskTracker/createComment',
  CREATE_NEW_TASK: '/taskTracker/createTask',
  EDIT_TASK: '/taskTracker/editTask',
  APPLY_OPT_OUT: '/appointments/applyOptOut',

  TREATMENT_CYCLES_REPORT: '/reports/treatmentCyclesPaymentsReport',
  PATIENT_MILESTONES_REPORT: '/reports/treatmentCyclesReport',
  GET_ALL_LAB_TESTS: '/labs/getAllLabTests',
  CREATE_OTHER_APPOINTMENT_REASON: '/appointments/createOtherAppointmentReason',
  CREATE_ALERT: '/alerts/createAlert',
  GET_ALL_ALERTS: '/alerts/getAllAlerts',
  UPDATE_ALERT: '/alerts/editAlert',
  DELETE_ALERT: '/alerts/deleteAlert',
  GET_ALL_ACTIVE_VISIT_APPOINTMENTS:
    '/appointments/getAllActiveVisitAppointments',
  DELETE_RECEIPT: '/expenses/deleteReceipt',
  GET_AVAILABLE_GRN_INFO_BY_ITEM_ID: '/pharmacy/showAvailableGrnInfoByItemId',
  GET_CONSULTANT_ROASTERS: '/consultantRoaster/getAllConsultantRoasters',
  ADD_CONSULTANT_ROASTER: '/consultantRoaster/createConsultantRoaster',
  EDIT_CONSULTANT_ROASTER: '/consultantRoaster/editConsultantRoaster',
  DOWNLOAD_EMBRYOLOGY_REPORT: '/embryology/downloadEmbryologyReport',
  DOWNLOAD_EMBRYOLOGY_IMAGES_REPORT:
    '/embryology/downloadEmbryologyImagesReport',
  GET_ERA_CONSENTS_BY_VISIT_ID: '/icsi/getEraConsentsByVisitId',
  UPLOAD_ERA_CONSENT_FORM: '/icsi/uploadEraConsent',
  DELETE_ERA_CONSENT_FORM: '/icsi/deleteEraConsent',
  REVIEW_ERA_CONSENTS: '/icsi/reviewEraConsents',
  GET_TREATMENT_ERA_SHEET_BY_TREATMENT_CYCLE_ID:
    '/treatment/getTreatmentEraSheetByTreatmentCycleId',
  UPDATE_TREATMENT_ERA_SHEET_BY_TREATMENT_CYCLE_ID:
    '/treatment/updateTreatmentEraSheetByTreatmentCycleId',
  GET_DEFAULT_OT_PERSONS: '/masterData/otRecord/getDefaultPersonsList',
  ADD_NEW_DEFAULT_OT_PERSONS: '/masterData/otRecord/saveDefaultPerson',
  EDIT_DEFAULT_OT_PERSONS: '/masterData/otRecord/editDefaultPerson',
  DELETE_TASK_IMAGE: '/taskTracker/deleteReferenceImage',
  UPLOAD_TASK_IMAGE: '/taskTracker/addReferenceImages',

  GET_OTHER_PAYMENTS_STATUS: '/otherPayments/getOtherPaymentsStatus',
  ADD_OTHER_PAYMENT: '/otherPayments/addNewPayment',
  GET_OTHER_PAYMENTS_ORDER_ID: '/otherPayments/getOrderId',
  SEND_OTHER_PAYMENTS_TRANSACTION: '/otherPayments/sendTransactionId',
  UPLOAD_EMBRYOLOGY_IMAGE: '/embryology/uploadEmbryologyImage',
  DELETE_EMBRYOLOGY_IMAGE: '/embryology/deleteEmbryologyImage',

  DOWNLOAD_OTHER_PAYMENTS_INVOICE: '/otherPayments/downloadInvoice',
  GET_INDENT_LIST: '/ip/getIndentDetails',
  ADD_NEW_INDENT: '/ip/addNewIndent',

  // IP Module endpoints
  GET_BUILDINGS: '/ip/getBuildings',
  GET_FLOORS: '/ip/getFloors',
  GET_ROOMS: '/ip/getRoom',
  GET_BEDS: '/ip/getBeds',
  GET_ACTIVE_IP: '/ip/getActiveIP',
  GET_CLOSED_IP: '/ip/getClosedIP',
  CREATE_IP_REGISTRATION: '/ip/createIPRegistration',
}

export const ACCESS_TYPES = {
  READ: 'R',
  WRITE: 'W',
  NO_ACCESS: 'N',
}
