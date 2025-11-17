// Allura Imports Inc. - Purchase Order Generator
// Main script file for handling data and generating PDFs.

// Helper function to convert field names to valid HTML IDs
function toId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('PO Generator loaded.');

    // Dynamically create the PO Detail fields
    const poDetailsContainer = document.getElementById('po-details-grid');
    if (poDetailsContainer) {
        const poFields = [
            "PO Date", "PO Number", "Ship Date", "Cancel Date", "Vendor", "Origin", "Ship Terms", "Pay Terms",
            "Destination", "Department", "Class", "Sub Class", "Label/Brand", "Season", "Year",
            "Royalty Code", "Item Description", "Top Fabric", "Bottom Fabric"
        ];
        poFields.forEach(field => {
            const id = toId(field);
            const div = document.createElement('div');
            div.innerHTML = `
                <label for="${id}" class="block text-sm font-medium text-gray-700">${field}</label>
                <input type="text" id="${id}" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            `;
            poDetailsContainer.appendChild(div);
        });
    }

    const csvUpload = document.getElementById('csv-upload');
    const fileNameSpan = document.getElementById('file-name');
    let uploadedData = [];

    if (csvUpload) {
        csvUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                fileNameSpan.textContent = file.name;
                Papa.parse(file, {
                    header: true,
                    complete: (results) => {
                        uploadedData = results.data;
                        console.log('CSV data parsed:', uploadedData);
                    },
                    error: (error) => {
                        console.error('Error parsing CSV:', error);
                        fileNameSpan.textContent = 'Error parsing file!';
                    }
                });
            } else {
                fileNameSpan.textContent = 'No file chosen';
            }
        });
    }

    // Event listener for the "Generate PO" button
    const generateButton = document.getElementById('generate-po');
    if (generateButton) {
        generateButton.addEventListener('click', () => {
            if (uploadedData.length === 0) {
                alert('Please upload a CSV file with style data.');
                return;
            }
            const processedData = processData(uploadedData);
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
        "PO Date", "PO Number", "Ship Date", "Cancel Date", "Vendor", "Origin", "Ship Terms", "Pay Terms",
        "Destination", "Department", "Class", "Sub Class", "Label/Brand", "Season", "Year",
        "Royalty Code", "Item Description", "Top Fabric", "Bottom Fabric"
    ];
    poFields.forEach(field => {
        const id = toId(field);
        poDetails[field] = document.getElementById(id).value;
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

        // Add PO Details table
        const poDetailsBody = [];
        for (let i = 0; i < poFields.length; i += 2) {
            poDetailsBody.push([
                poFields[i], poDetails[poFields[i]],
                poFields[i+1] ? poFields[i+1] : '', poDetails[poFields[i+1]] ? poDetails[poFields[i+1]] : ''
            ]);
        }

        doc.autoTable({
            startY: 40,
            body: poDetailsBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1 },
            didDrawCell: (data) => {
                if (data.column.index % 2 === 0) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }
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

                // Page totals - Filter rows belonging to the current page
                const pageRows = data.table.body.filter(row => row.pageNumber === data.pageNumber);
                const pagePcs = pageRows.reduce((sum, row) => sum + parseFloat(row.cells[2].content || 0), 0);
                const pageDz = pageRows.reduce((sum, row) => sum + parseFloat(row.cells[5].content || 0), 0);
                const pageAmount = pageRows.reduce((sum, row) => sum + parseFloat(row.cells[6].content || 0), 0);

                doc.autoTable({
                    body: [
                        ['Totals', '', pagePcs.toFixed(0), '', '', pageDz.toFixed(2), pageAmount.toFixed(2), '', '', '', '']
                    ],
                    startY: doc.internal.pageSize.height - 40,
                    theme: 'grid',
                    styles: { fontSize: 8, fontStyle: 'bold' },
                    didParseCell: (cellData) => {
                         if (cellData.column.index > 1) {
                            cellData.cell.styles.halign = 'right';
                         }
                    }
                });

                // Image placeholder and remarks
                doc.rect(14, doc.autoTable.previous.finalY + 5, 50, 50); // Image box
                doc.text("Remarks:", 70, doc.autoTable.previous.finalY + 10);
                doc.text(remarks, 70, doc.autoTable.previous.finalY + 15, { maxWidth: 120 });
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
