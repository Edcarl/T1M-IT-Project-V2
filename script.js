document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const tableBody = document.querySelector('#outputTable tbody');
        // const summaryBody = document.querySelector('#summaryTable tbody');
        tableBody.innerHTML = '';
        // summaryBody.innerHTML = '';

        const employeeData = {};

        rows.forEach((row, index) => {
            if (index > 0) {
                const employeeId = row[0];
                const excelDate = row[1];
                const jsDate = getJsDateFromExcel(excelDate);
                const dateString = jsDate.toLocaleDateString('en-GB'); // Format as dd/mm/yyyy

                if (!employeeData[employeeId]) {
                    employeeData[employeeId] = {};
                }

                if (!employeeData[employeeId][dateString]) {
                    employeeData[employeeId][dateString] = [];
                }

                employeeData[employeeId][dateString].push(jsDate);
            }
        });

        for (const employeeId in employeeData) {
            for (const date in employeeData[employeeId]) {
                const timestamps = employeeData[employeeId][date];
                timestamps.sort((a, b) => a - b); // Sort timestamps

                const timeIn = timestamps[0];
                    let timeOut = timestamps[timestamps.length - 1];

                    const tr = document.createElement('tr');
                    const employeeIdCell = document.createElement('td');
                    const dateCell = document.createElement('td');
                    const timeInCell = document.createElement('td');
                    const timeOutCell = document.createElement('td');
                    const totalHoursCell = document.createElement('td');
                    const statusCell = document.createElement('td');
                    const lateCell = document.createElement('td');
                    const editButtonCell = document.createElement('td');

                    employeeIdCell.textContent = employeeId;
                    dateCell.textContent = date;
                    timeInCell.textContent = timeIn.toLocaleTimeString('en-US', { hour12: true });

                    const timeOutInput = document.createElement('input');
                    timeOutInput.type = 'time';
                    timeOutInput.value = timestamps.length > 1 ? timeOut.toLocaleTimeString('en-US', { hour12: false }) : '';
                    timeOutCell.appendChild(timeOutInput);

                const updateTotalHours = () => {
                    const timeOutValue = timeOutInput.value;
                    if (timeOutValue) {
                        const [hours, minutes] = timeOutValue.split(':');
                        timeOut.setHours(hours, minutes);

                        const totalHours = ((timeOut - timeIn) / (1000 * 60 * 60)).toFixed(2); // Calculate total hours
                        const totalMins = ((timeOut - timeIn) / (1000 * 60)).toFixed(2);
                        totalHoursCell.textContent = totalHours;

                        let status;
                        if (totalHours-1 < 7.5 && totalHours-1 > 0) {
                            let deficit = Math.round(480 - totalMins+60);
                            status = "Under time: " + deficit + " mins";
                        } else if (totalHours-1 > 8.5) {
                            let OT = Math.round(totalHours-1 - 8);
                            status = "Over time: " + OT + " hour/s";
                        } else if (totalHours <= 0) {
                            status = "Didn't clock out";
                        } else {
                            status = "Regular time";
                        }
                        statusCell.textContent = status;
                    } else {
                        totalHoursCell.textContent = "N/A";
                        statusCell.textContent = "Didn't clock out";
                    }

                    const scheduledTimeIn = new Date(timeIn);
                    scheduledTimeIn.setHours(8, 30, 0, 0); // Set to 8:30 AM

                    let lateness = 0;
                    if (timeIn > scheduledTimeIn) {
                        lateness = (timeIn - scheduledTimeIn) / (1000 * 60); // in minutes
                    }

                    const hoursLate = Math.floor(lateness / 60);
                    const minutesLate = Math.floor(lateness % 60);

                    if (hoursLate === 0 && minutesLate === 0) {
                        lateCell.textContent = 'NA';
                    } else if (hoursLate === 0) {
                        lateCell.textContent = `${minutesLate} min/s late`;
                    }
                    else {
                        lateCell.textContent = `${hoursLate}hr/s and ${minutesLate}min/s`;
                    }
                    
                };

                timeOutInput.addEventListener('change', updateTotalHours);
                updateTotalHours();

                tr.appendChild(employeeIdCell);
                tr.appendChild(dateCell);
                tr.appendChild(timeInCell);
                tr.appendChild(timeOutCell);
                tr.appendChild(totalHoursCell);
                tr.appendChild(statusCell);
                tr.appendChild(lateCell);

                tableBody.appendChild(tr);
            }
        }
    };

    reader.readAsArrayBuffer(file);
});

document.getElementById('searchButton').addEventListener('click', function() {
    const employeeId = document.getElementById('searchEmployeeId').value.toLowerCase();
    const date = document.getElementById('searchDate').value;
    const employeeTableBody = document.querySelector('#employeeTable tbody');
    employeeTableBody.innerHTML = '';

    const tableBody = document.querySelector('#outputTable tbody');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const rowEmployeeId = cells[0].textContent.toLowerCase();
        const rowDate = cells[1].textContent;

        // timeOutInput is in the 4th cell (index 3)
        const timeOutInput = cells[3].querySelector('input');
        const timeOutValue = timeOutInput ? timeOutInput.value : '';

            if ((employeeId === '' || rowEmployeeId.includes(employeeId)) &&
                (date === '' || rowDate === new Date(date).toLocaleDateString('en-GB'))) {
                const tr = document.createElement('tr');
                for (let j = 0; j < cells.length; j++) {
                    const td = document.createElement('td');
                    // if (cells[j].querySelector('input')) {
                    //     const input = cells[j].querySelector('input');
                        
                    //     td.appendChild(input.cloneNode(true));
                    if (j === 3 && timeOutInput) {
                        // Convert timeOutInput value to text
                        td.textContent = timeOutValue;
                    } else if (cells[j].querySelector('input')) {
                        const input = cells[j].querySelector('input');
                        td.appendChild(input.cloneNode(true));
                    } else {
                        td.textContent = cells[j].textContent;
                    }
                    tr.appendChild(td);
                }
                employeeTableBody.appendChild(tr);
            }
    }
    
});

document.getElementById('clearButton').addEventListener('click', function() {
    const employeeTableBody = document.getElementById('employeeTable').getElementsByTagName('tbody')[0];
    employeeTableBody.innerHTML = '';
});

// Function to convert Excel date to JavaScript date
    function getJsDateFromExcel(excelDate) {
        const excelEpoch = new Date(1899, 11, 30); // Excel epoch starts on December 30, 1899
        const msPerDay = 86400000; // Number of milliseconds in a day
        const jsDate = new Date(excelEpoch.getTime() + excelDate * msPerDay);
        return jsDate;
    }   

document.getElementById('btn-export').addEventListener('click', function() {
    // const table = document.getElementById('outputTable');
    const table = document.getElementById('employeeTable');
    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
    const fileInput = document.getElementById('fileInput');

    // Get today's date
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();

    const todayDate = yyyy + '-' + mm + '-' + dd;

    // Generate filename with today's date
    const filename = `EmployeeAttendance_${todayDate}.xlsx`;

    if (!fileInput.files.length) {
        alert('Please select a file before exporting.');
        return;
    }

    XLSX.writeFile(workbook, filename);
});

document.getElementById('btn-reload').addEventListener('click', function() { 
    location.reload();
});