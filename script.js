
// Allura Imports Inc. - Purchase Order Generator
// Main script file for handling data and generating PDFs.

// Helper function to convert field names to valid HTML IDs
function toId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('PO Generator loaded.');

    // Dynamically create the PO Detail fields
    const poDetailsContainer = document.getElementById('po-details-grid');
    if (poDetailsContainer) {
        const poFields = [
            "PO Date", "Ship Date", "Cancel Date", "PO Number", "Vendor", "Origin", "Ship Terms", "Pay Terms",
            "Destination", "Department", "Class", "Sub Class", "Label/Brand", "Season", "Year",
            "Royalty Code", "Item Description", "Top Fabric", "Bottom Fabric"
        ];
        poFields.forEach(field => {
            const id = toId(field);
            const div = document.createElement('div');

            let inputHtml;
            if (field === "Season") {
                inputHtml = `
                    <label for="${id}" class="label">${field}</label>
                    <select id="${id}" class="custom-input">
                        <option>Spring</option>
                        <option>Fall</option>
                    </select>
                `;
            } else if (field === "Destination") {
                inputHtml = `
                    <label for="${id}" class="label">${field}</label>
                    <select id="${id}" class="custom-input">
                        <option>NY</option>
                        <option>LA</option>
                        <option>Other</option>
                    </select>
                `;
            } else if (field === "Origin") {
                inputHtml = `
                    <label for="${id}" class="label">${field}</label>
                    <select id="${id}" class="custom-input">
                        <option>Egypt</option>
                        <option>Bangladesh</option>
                        <option>China</option>
                        <option>Pakistan</option>
                        <option>India</option>
                        <option>Other</option>
                    </select>
                    <input type="text" id="${id}-other" placeholder="Enter other origin" class="hidden custom-input mt-2">
                `;
            } else {
                const isDateField = field.includes('Date');
                const inputType = isDateField ? 'date' : 'text';
                const placeholder = `Enter ${field}`;
                inputHtml = `
                    <label for="${id}" class="label">${field}</label>
                    <input type="${inputType}" id="${id}" placeholder="${placeholder}" class="custom-input">
                `;
            }

            div.innerHTML = inputHtml;
            poDetailsContainer.appendChild(div);

            if (field === "Origin") {
                const originSelect = document.getElementById('origin');
                const otherOriginInput = document.getElementById('origin-other');
                originSelect.addEventListener('change', (event) => {
                    if (event.target.value === 'Other') {
                        otherOriginInput.classList.remove('hidden');
                    } else {
                        otherOriginInput.classList.add('hidden');
                    }
                });
            }
        });

        // Set default dates and year
        const poDate = document.getElementById('po-date');
        const shipDate = document.getElementById('ship-date');
        const cancelDate = document.getElementById('cancel-date');
        const yearInput = document.getElementById('year');

        if (yearInput) {
            yearInput.value = '2026';
        }

        if (poDate && shipDate && cancelDate) {
            const today = new Date();
            poDate.value = formatDate(today);

            const ship = new Date();
            ship.setMonth(ship.getMonth() + 4);
            ship.setDate(1);
            shipDate.value = formatDate(ship);

            const cancel = new Date(ship);
            cancel.setDate(cancel.getDate() + 30);
            cancelDate.value = formatDate(cancel);
        }
    }

    const csvUpload = document.getElementById('csv-upload');
    if (csvUpload) {
        csvUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                Papa.parse(file, {
                    header: true,
                    complete: (results) => {
                        window.uploadedData = results.data;
                        console.log('CSV data parsed:', window.uploadedData);
                    },
                    error: (error) => {
                        console.error('Error parsing CSV:', error);
                    }
                });
            }
        });
    }

    // Event listener for the "Generate PO" button
    const generateButton = document.getElementById('generate-po');
    if (generateButton) {
        generateButton.addEventListener('click', () => {
            if (!window.uploadedData || window.uploadedData.length === 0) {
                alert('Please upload a CSV file with style data.');
                return;
            }
            const processedData = processData(window.uploadedData);
            generatePdf(processedData);
        });
    }
});

function generatePdf(groupedData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Collect header data from the form
    const companyInfo = {
        name: document.getElementById('company-name').value,
        address: document.getElementById('company-address').value,
        tel: document.getElementById('company-tel').value,
        notice: document.getElementById('testing-notice').value
    };

    const poDetails = {};
    const poFields = [
        "PO Date", "Ship Date", "Cancel Date", "PO Number", "Vendor", "Origin", "Ship Terms", "Pay Terms",
        "Destination", "Department", "Class", "Sub Class", "Label/Brand", "Season", "Year",
        "Royalty Code", "Item Description", "Top Fabric", "Bottom Fabric"
    ];
    poFields.forEach(field => {
        const id = toId(field);
        const element = document.getElementById(id);
        let value = element.value;

        if (field === 'Origin' && value === 'Other') {
            value = document.getElementById('origin-other').value;
        }
        poDetails[field] = value;
    });

    const remarks = document.getElementById('remarks-text').value;

    let isFirstPage = true;

    for (const groupKey in groupedData) {
        if (!isFirstPage) {
            doc.addPage();
        }
        isFirstPage = false;

        const group = groupedData[groupKey];

        // Add headers
        doc.setFontSize(16);
        doc.text(companyInfo.name, 14, 22);
        doc.setFontSize(10);
        doc.text(companyInfo.address, 14, 28);
        doc.text(companyInfo.tel, 14, 34);

        doc.setFontSize(12);
        doc.text("PURCHASE ORDER", 200, 22, { align: 'right' });

        // Add PO Number below the header
        doc.setFontSize(10);
        doc.setTextColor('#00A7FF');
        doc.setFont(undefined, 'bold');
        doc.text(`PO Number: ${poDetails["PO Number"]}`, 200, 28, { align: 'right' });
        doc.setFont(undefined, 'normal');
        doc.setTextColor('#000000');

        // Add PO Details table
        const poDetailsBody = [];
        const filteredPoFields = poFields.filter(field => field !== "PO Number");
        for (let i = 0; i < filteredPoFields.length; i += 2) {
            poDetailsBody.push([
                { content: filteredPoFields[i], styles: { fontStyle: 'bold', fillColor: '#f3f4f6' } },
                poDetails[filteredPoFields[i]],
                filteredPoFields[i+1] ? { content: filteredPoFields[i+1], styles: { fontStyle: 'bold', fillColor: '#f3f4f6' } } : '',
                filteredPoFields[i+1] ? poDetails[filteredPoFields[i+1]] : ''
            ]);
        }

        doc.autoTable({
            startY: 40,
            body: poDetailsBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1.5 },
        });

        const tableBody = group.map(row => [
            row['Style Number'],
            row['Sizes'],
            row['Pcs'],
            row['Price/Pc'],
            row['Price/DZ'],
            row['Qty (DZ)'],
            row['Amount'],
            row['Packing: Master'],
            row['Packing: Inner'],
            row['Inner: Colorway 1'],
            row['Inner: Colorway 2']
        ]);

        doc.autoTable({
            head: [['Style Number', 'Sizes', 'Pcs', 'Price/Pc', 'Price/DZ', 'Qty (DZ)', 'Amount', 'Packing: Master', 'Packing: Inner', 'Inner: C1', 'Inner: C2']],
            body: tableBody,
            startY: doc.autoTable.previous.finalY + 5,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: '#e5e7eb', textColor: '#1f2937', fontStyle: 'bold' },
            didParseCell: (data) => {
                if (data.row.section === 'body' && data.column.index > 1) { // Right align numeric columns
                    data.cell.styles.halign = 'right';
                }
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(12);
                    doc.text("PURCHASE ORDER (cont.)", 200, 22, { align: 'right' });
                }

                // Page totals - Correctly filter rows for the current page
                const pageRows = data.table.body.filter(row => row.pageNumber === data.pageNumber);
                const pagePcs = pageRows.reduce((sum, row) => sum + parseFloat(row.cells[2].content.replace(/,/g, '') || 0), 0);
                const pageDz = pageRows.reduce((sum, row) => sum + parseFloat(row.cells[5].content.replace(/,/g, '') || 0), 0);
                const pageAmount = pageRows.reduce((sum, row) => sum + parseFloat(row.cells[6].content.replace(/,/g, '') || 0), 0);

                const finalY = doc.autoTable.previous.finalY;

                if (finalY < doc.internal.pageSize.height - 80) { // Add space to avoid overlap
                    doc.autoTable({
                        body: [['Page Totals', '', pagePcs.toFixed(0), '', '', pageDz.toFixed(2), pageAmount.toFixed(2), '', '', '', '']],
                        startY: finalY + 2,
                        theme: 'grid',
                        styles: { fontSize: 8, fontStyle: 'bold' },
                        didParseCell: (cellData) => {
                             if (cellData.column.index > 1) {
                                cellData.cell.styles.halign = 'right';
                             }
                        }
                    });

                    const bottomContentY = doc.autoTable.previous.finalY + 10;
                    doc.rect(14, bottomContentY, 60, 50); // Image box - 2x size
                    doc.text("Remarks:", 80, bottomContentY + 5);
                    doc.text(remarks, 80, bottomContentY + 10, { maxWidth: 110 });

                    doc.text("Testing Notice:", 14, bottomContentY + 60);
                    doc.text(companyInfo.notice, 14, bottomContentY + 65, { maxWidth: 180 });
                }
            }
        });
    }

    doc.save('PurchaseOrder.pdf');
}

function processData(data) {
    // 1. Process and calculate for each row
    const calculatedData = data
        .map(row => {
            const pcs = parseFloat(row['Pcs']);
            const pricePerPiece = parseFloat(row['Price/Pc']);

            // Skip rows that don't have the necessary data to be processed.
            if (!row['Style Number'] || isNaN(pcs) || isNaN(pricePerPiece)) {
                return null;
            }

            return {
                ...row,
                'Price/DZ': (pricePerPiece * 12).toFixed(2),
                'Qty (DZ)': (pcs / 12).toFixed(2),
                'Amount': (pcs * pricePerPiece).toFixed(2)
            };
        })
        .filter(row => row !== null); // Remove invalid rows

    // 2. Group the data by style number (ignoring the first digit)
    const groupedData = calculatedData.reduce((acc, row) => {
        const styleNumber = row['Style Number'];
        const groupKey = styleNumber.substring(1);

        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(row);
        return acc;
    }, {});

    return groupedData;
}
