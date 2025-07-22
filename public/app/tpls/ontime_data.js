ontime_data = {
    // 'weburl': '#SERVER_URL#', //update env.json if you need different URL
    'weburl': 'https://app.dev.ontimeits.com/ontime/api/', //update env.json if you need different URL
    'defaultState': 'redirect',
    'redirectStateOrURL': 'login',
    'homepage': 'app.dashboard',
    'weatherCity': 'New York, NY',
    'employeeReasons': [
        { key: "SICK", value: "Sick" },
        { key: "PSNL", value: "Personal Day" },
        { key: "VCTN", value: "Vacation" },
        { key: "HOLI", value: "Holiday" },
        { key: "BERV", value: "Bereavement" },
        { key: "JUDU", value: "Jury Duty" }
    ],
    'patientReasons': [
        { key: "HPTL", value: "Hospitalization" },
        { key: "VCTN", value: "Vacation" },
        { key: "INCW", value: "Inclement weather" },
        { key: "NOSP", value: "No Service As Per Patient" },
        { key: "NOSC", value: "No Service - Coverage" },
        { key: "USPC", value: "Unspecified" }
    ],
    'recurranceTypes': { D: "Daily", W: "Weekly", N: "No Repeat" },
    'eventTypes': { S: "Schedule", A: "Available", U: "Unavailable" },
    benefitList: [{ key: 'SIT', value: 'Sick Time' }, { key: 'PRT', value: 'Personal Time' }, { key: 'VCT', value: 'Vacation Time' }, { key: 'HEC', value: 'Healthcare' },
    { key: 'WFC', value: 'WPP Flex Cards' }, { key: '401', value: '401K' }],
    benefitMap: {
        'SIT': 'Sick Time',
        'PRT': 'Personal Time',
        'VCT': 'Vacation Time',
        'HEC': 'Healthcare',
        'WFC': 'WPP Flex Cards',
        //        '401': '401K'
    },
    'company_code': "TRT",
    employee_dispatch_responses: {
        '1': 'Interested',
        '0': 'Not Interested',
        '2': 'Not Sure'
    },
    positionGroups: {
        'NURSING_CARE_COORDINATOR': "NCC",
        'STAFFING_COORDINATOR': "SC",
        'OFFICE_STAFF': "OS"
    },
    patientRecordsObj: [
        { option: "Employee Supervision", value: "Employee_Supervision" },        
        { option: "Emergency & Disaster", value: "Emergency_Disaster" },
        { option: "Home Care Plan", value: "Home_Care_Plan" },
        { option: "Medical Orders", value: "Medical_Orders" },
        { option: "Medication Reconciliation", value: "Medication_Reconciliation" },
        { option: "Nursing Assessment", value: "Nursing_Assessment" },
        { option: "Patient Consents", value: "Patient_Consents" },
        { option: "Patient Record Upload", value: "Pdf_Record" },
        { option: "Progress Note", value: "Progress_Note" }
    ],
    patientRecordsRoutes: {
        Nursing_Assessment: 'app.nursing_assessment',
        Medication_Reconciliation: 'app.medication_reconciliation',
        Progress_Note: 'app.progress_note',
        Medical_Orders: 'app.medical_orders',
        Home_Care_Plan: 'app.home_care_plan',
        Patient_Consents: 'app.patient_consents',
        Pdf_Record: 'app.patient_record_upload',
        Employee_Supervision: 'app.employee_supervision',
        Emergency_Disaster: 'app.emergency_disaster',
    },
    'pastEventAuthorizationPassword': '!avalanche!',
    'hrPassword': 'Avalanche!HR',
    'date_time_format': "yyyy/MM/dd hh:mm:ss a",
    amazonPublicUrl: "#AWS_S3_PROFILE_IMAGE_PUBLIC_URL#",
    amazonSignatureUrl: "#AWS_S3_SIGNATURE_PUBLIC_URL#",
    reportTypes: [
        { id: 'applicationlistreport', label: "Application List Report" },
        { id: 'applicationmetricsreport', label: "Application Metrics Report" },
        { id: 'claimrejectionreport', label: "Billing - Claim Rejection Report" },
        { id: 'detailagingreport', label: "Billing - Detail Aging Report" },
        { id: 'claimhistoryandagingreport', label: "Claim History And Aging Report" },
        { id: 'summaryagingreport', label: "Billing - Summary Aging Report" },
        { id: 'billingmonitorreport', label: "Billing - Monitor Report" },
        { id: 'complaints', label: "Complaints Report" },
        { id: 'employeecensus', label: "Employee Census - Compliance Tracker" },
        { id: 'employeelastpunchin', label: "Employee Last Punchin Date Report" },
        { id: 'employeebenefitshealthcare', label: "Employee Healthcare Benefits Report" },
        //        {id: 'employeebenefits401k', label: "Employee 401k benefits Report"},
        { id: 'employeeothours', label: "Employee OT Hours Report" },
        { id: 'ptoreport', label: "Employee PTO Report" },
        { id: 'employeetimesheet', label: "Employee Time Sheet" },
        { id: 'employeeutilization', label: "Employee Utilization Report" },
        { id: 'employeeworkedhoursbycounty', label: "Employee Worked Hours - By County" },
        { id: 'wppreport', label: "Employee WPP Report" },
        { id: 'eventactivityreport', label: "Event Logs Report" },
        { id: 'evvauditreport', label: "EVV Audit Report" },
        { id: 'evv-emedny-error-report', label: "EVV Errors for EMedNY Report" },
        { id: 'missedpunchreport', label: "Missed Punch Report" },
        { id: 'satisfactionSurveyReport', label: "Satisfaction Survey Report" },
        { id: 'totalworkedhours', label: "Total Patient Worked Hours Summary" },
        { id: 'workedhours', label: "Worked Hours" },
        { id: 'notesreport', label: "Employee/Patient Notes" },
        { id: 'lossofhoursreport', label: "Loss Hours" },
        { id: 'patientcensus', label: "Patient Census" },
        { id: 'patienttimesheet', label: "Patient Time Sheet" },
        { id: 'employeedeactivatereport', label: "Employee Deactivate Report" },
        { id: 'revenuereconciliationreport', label: "Revenue Reconciliation Report" },
        { id: 'revenuereconciliationbycounty', label: "Revenue Reconciliation By County Report" },
        { id: 'weeklyotanalysis', label: "Weekly OT Analysis Report" },
        { id: 'employeeSupervisionHistory', label: "Employee Supervison History" },

    ],
    defaultTimezone: 'America/New_York',
    usTimezones: [
        {
            'googleTimezone': 'America/New_York',
            'displayValue': 'Eastern Time (New York)'
        },
        {
            'googleTimezone': 'America/Chicago',
            'displayValue': 'Central Time (Chicago)'
        },
        {
            'googleTimezone': 'America/Phoenix',
            'displayValue': 'Mountain Time (Phoenix)'
        },
        {
            'googleTimezone': 'America/Los_Angeles',
            'displayValue': 'Pacific Time (Los Angeles)'
        },
        {
            'googleTimezone': 'America/Anchorage',
            'displayValue': 'Alaska Time (Anchorage)'
        },
        {
            'googleTimezone': 'Pacific/Honolulu',
            'displayValue': 'Hawaii Time (Honolulu)'
        }
    ],
    patientRecordOrigin: {
        WEB: { value: 'WEB', label: 'Web' },
        MOBILE: { value: 'MOBILE', label: 'Mobile' }
    },
    formTypes: [
        { id: 'complaintform', label: "Complaint Form" }
    ],
    complaintTypes: [
        { title: 'Billing Issues', value: 'billing_issues' },
        { title: 'Cultural Sensitivity', value: 'cultural_sensitivity' },
        { title: 'Equipment Failures', value: 'equipment_failures' },
        { title: 'Family Involvement Concerns', value: 'family_involvement_concerns' },
        { title: 'Inadequate Care', value: 'inadequate_care' },
        { title: 'Lack of Care Coordination', value: 'lack_of_care_coordination' },
        { title: 'Lack of Communication', value: 'lack_of_communication' },
        { title: 'Medication Errors', value: 'medication_errors' },
        { title: 'No Service', value: 'no_service' },
        { title: 'Payroll Issues', value: 'payroll_issues' },
        { title: 'Patient – Staff Conflicts', value: 'patient_staff_conflicts' },
        { title: 'Poor Hygiene', value: 'poor_hygiene' },
        { title: 'Privacy Concerns', value: 'privacy_concerns' },
        { title: 'Safety Issues', value: 'safety_issues' },
        { title: 'Scheduling Problems', value: 'scheduling_problems' },
        { title: 'Service Quality', value: 'service_quality' },
        { title: 'Staff Professionalism', value: 'staff_professionalism' },
        { title: 'Staff Punctuality', value: 'staff_punctuality' },
        { title: 'Technology Issues', value: 'technology_issues' },
        { title: 'Transportation Issues', value: 'transportation_issues' },
        {title: 'Unmet Medical Needs', value: 'unmet_medical_needs'},
        {title: 'Unclear Procedures and Policies', value: 'unclear_procedures_policies'},
        {title: 'Other', value: 'other'}
    ],
    complaintMethods: [
        {title: 'Phone', value: 'PHONE'},
        {title: 'Email', value: 'EMAIL'},
        {title: 'Writing', value: 'WRITING'},
        {title: 'In Person', value: 'IN_PERSON'},
    ],
    complaintContactType: [
        {title: 'Phone', value: 'PHONE'},
        {title: 'Email', value: 'EMAIL'},
        {title: 'Address', value: 'ADDRESS'},
    ],
    complainantRelationshipType: [
        {title: 'Patient', value: 'PATIENT'},
        {title: 'Worksite', value: 'WORKSITE'},
        {title: 'Employee', value: 'EMPLOYEE'},   
        {title: 'Vendor', value: 'VENDOR'},   
    ],
    unitValues: [{value: 0.25, label: "15 min"}, {value: 0.5, label: "30 min"}, {value: 0.45, label: "45 min"}, {value: 1, label: "1 hr"}],
    medicationFrequency: [
        { key: "Bedtime", value: "Bedtime" },
        { key: "BID", value: "2 times a day (BID)" },
        { key: "Daily", value: "Daily" },
        { key: "Every12Hours", value: "Every 12 hours" },
        { key: "Every24Hours", value: "Every 24 hours" },
        { key: "Every3Hours", value: "Every 3 hours" },
        { key: "Every4Hours", value: "Every 4 hours" },
        { key: "Every6Hours", value: "Every 6 hours" },
        { key: "Every8Hours", value: "Every 8 hours" },
        { key: "FiveTimesADay", value: "5 times a day" },
        { key: "QID", value: "4 times a day (QID)" },
        { key: "TID", value: "3 times a day (TID)" },
        { key: "Other", value: "Other" }
    ],
    medicationRoutes: [
        { key: "Inhalation", value: "Inhalation" },
        { key: "Intramuscular", value: "Intramuscular" },
        { key: "Intranasal", value: "Intranasal" },
        { key: "Intravenous", value: "Intravenous" },
        { key: "Intraosseous", value: "Intraosseous" },
        { key: "Nasogastric", value: "Nasogastric" },
        { key: "Nasointestinal", value: "Nasointestinal" },
        { key: "Oral", value: "Oral" },
        { key: "PercutaneousEndoscopicGastrostomy", value: "Percutaneous Endoscopic Gastrostomy" },
        { key: "Rectal", value: "Rectal" },
        { key: "Subcutaneous", value: "Subcutaneous" },
        { key: "Sublingual", value: "Sublingual" },
        { key: "Topical", value: "Topical" },
        { key: "Vaginal", value: "Vaginal" }
    ],
    defaultDistance: 3,
    'statesByCountry': {
        'CA': [
            {name: 'ON - Ottawa', abbreviation: 'ON'},
            {name: 'QC - Quebec', abbreviation: 'QC'},
            {name: 'NS - Nova Scotia', abbreviation: 'NS'},
            {name: 'NB - New Brunswick', abbreviation: 'NB'},
            {name: 'MB - Manitoba', abbreviation: 'MB'},
            {name: 'BC - British Columbia', abbreviation: 'BC'},
            {name: 'PE - Prince Edward Island', abbreviation: 'PE'},
            {name: 'SK - Saskatchewan', abbreviation: 'SK'},
            {name: 'AB - Alberta', abbreviation: 'AB'},
            {name: 'NL - Newfoundland and Labrador', abbreviation: 'NL'}
        ],
        'US': [
            {name: 'AL - ALABAMA', abbreviation: 'AL'},
            {name: 'AK - ALASKA', abbreviation: 'AK'},
                {name: 'AS - AMERICAN SAMOA', abbreviation: 'AS'},
            {name: 'AZ - ARIZONA', abbreviation: 'AZ'},
            {name: 'AR - ARKANSAS', abbreviation: 'AR'},
            {name: 'CA - CALIFORNIA', abbreviation: 'CA'},
            {name: 'CO - COLORADO', abbreviation: 'CO'},
            {name: 'CT - CONNECTICUT', abbreviation: 'CT'},
            {name: 'DE - DELAWARE', abbreviation: 'DE'},
            {name: 'DC - DISTRICT OF COLUMBIA', abbreviation: 'DC'},
            {name: 'FM - FEDERATED STATES OF MICRONESIA', abbreviation: 'FM'},
            {name: 'FL - FLORIDA', abbreviation: 'FL'},
            {name: 'GA - GEORGIA', abbreviation: 'GA'},
            {name: 'GU - GUAM', abbreviation: 'GU'},
            {name: 'HI - HAWAII', abbreviation: 'HI'},
            {name: 'ID - IDAHO', abbreviation: 'ID'},
            {name: 'IL - ILLINOIS', abbreviation: 'IL'},
            {name: 'IN - INDIANA', abbreviation: 'IN'},
            {name: 'IA - IOWA', abbreviation: 'IA'},
            {name: 'KS - KANSAS', abbreviation: 'KS'},
            {name: 'KY - KENTUCKY', abbreviation: 'KY'},
            {name: 'LA - LOUISIANA', abbreviation: 'LA'},
            {name: 'MA - MAINE', abbreviation: 'ME'},
            {name: 'MH - MARSHALL ISLANDS', abbreviation: 'MH'},
            {name: 'MD- MARYLAND', abbreviation: 'MD'},
            {name: 'MA - MASSACHUSETTS', abbreviation: 'MA'},
            {name: 'MI - MICHIGAN', abbreviation: 'MI'},
            {name: 'MN - MINNESOTA', abbreviation: 'MN'},
            {name: 'MS - MISSISSIPPI', abbreviation: 'MS'},
            {name: 'MO - MISSOURI', abbreviation: 'MO'},
            {name: 'MT - MONTANA', abbreviation: 'MT'},
            {name: 'NE - NEBRASKA', abbreviation: 'NE'},
            {name: 'NV - NEVADA', abbreviation: 'NV'},
            {name: 'NH - NEW HAMPSHIRE', abbreviation: 'NH'},
            {name: 'NJ - NEW JERSEY', abbreviation: 'NJ'},
            {name: 'NM - NEW MEXICO', abbreviation: 'NM'},
            {name: 'NY - NEW YORK', abbreviation: 'NY'},
            {name: 'NC - NORTH CAROLINA', abbreviation: 'NC'},
            {name: 'ND - NORTH DAKOTA', abbreviation: 'ND'},
            {name: 'MP - NORTHERN MARIANA ISLANDS', abbreviation: 'MP'},
            {name: 'OH - OHIO', abbreviation: 'OH'},
            {name: 'OK - OKLAHOMA', abbreviation: 'OK'},
            {name: 'OR - OREGON', abbreviation: 'OR'},
            {name: 'PW - PALAU', abbreviation: 'PW'},
            {name: 'PA - PENNSYLVANIA', abbreviation: 'PA'},
            {name: 'PR - PUERTO RICO', abbreviation: 'PR'},
            {name: 'RI - RHODE ISLAND', abbreviation: 'RI'},
            {name: 'SC - SOUTH CAROLINA', abbreviation: 'SC'},
            {name: 'SD - SOUTH DAKOTA', abbreviation: 'SD'},
            {name: 'TN - TENNESSEE', abbreviation: 'TN'},
            {name: 'TX - TEXAS', abbreviation: 'TX'},
            {name: 'UT - UTAH', abbreviation: 'UT'},
            {name: 'VT - VERMONT', abbreviation: 'VT'},
            {name: 'VI - VIRGIN ISLANDS', abbreviation: 'VI'},
            {name: 'VA - VIRGINIA', abbreviation: 'VA'},
            {name: 'WA - WASHINGTON', abbreviation: 'WA'},
            {name: 'WV - WEST VIRGINIA', abbreviation: 'WV'},
            {name: 'WI - WISCONSIN', abbreviation: 'WI'},
            {name: 'WY - WYOMING', abbreviation: 'WY'}
        ]
    },
    'terminologyBank' : {
        'CA': {
            'state': 'Province',
            'zipCode': 'Postal Code',
            'ssn': 'Social Security',
            'taxStatus2': 'T4A',
            'taxStatus1': 'T4'
        },
        'US': {
            'state': 'State',
            'zipCode': 'Zip Code',
            'ssn': 'SSN',
            'taxStatus2': '1099',
            'taxStatus1': 'w-2'
        }
    }
};

function arr_diff(a1, a2) {
    var a = [], diff = [];
    for (var i = 0; i < a1.length; i++)
        a[a1[i]] = true;
    for (var i = 0; i < a2.length; i++)
        if (a[a2[i]])
            delete a[a2[i]];
        else
            a[a2[i]] = true;
    for (var k in a)
        diff.push(k);
    return diff;
}

