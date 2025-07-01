import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const term = "F2025"

// Complete list of all departments from De Anza College
const allDepartments = [
    "ACCT", "ADMJ", "AFAM", "ANTH", "APRN", "ARTS", "ASAM", "ASTR", "AUTO", "BIOL", 
    "BUS", "CD", "CETH", "CHEM", "CHLX", "CIS", "CLP", "COMM", "COUN", "DANC", 
    "DMT", "ECON", "EDAC", "EDUC", "ELIT", "ENGL", "ENGR", "ES", "ESCI", "ESL", 
    "EWRT", "F/TV", "FREN", "GEO", "GEOL", "GERM", "GUID", "HIST", "HLTH", "HNDI", 
    "HTEC", "HUMA", "HUMI", "ICS", "INTL", "ITAL", "JAPN", "JOUR", "KNES", "KORE", 
    "LART", "LIB", "LING", "LRNA", "LS", "MAND", "MATH", "MET", "MUSI", "NAIS", 
    "NURS", "NUTR", "PARA", "PE", "PEA", "PERS", "PHIL", "PHTG", "PHYS", "POLI", 
    "POLS", "PSYC", "READ", "REST", "RUSS", "SIGN", "SKIL", "SOC", "SOSC", "SPAN", 
    "STAT", "THEA", "VIET", "WMST"
];

const fetchDepartment = async (department) => {
    const url = `https://www.deanza.edu/schedule/listings.html?dept=${department}&t=${term}`;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const data = await page.evaluate(() => {
            const rows = document.querySelectorAll('.table-schedule tbody tr');
            const tableData = [];

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 10) { // Ensure we have enough cells
                    tableData.push({
                        crn: cells[0]?.innerText.trim() || '',
                        course: cells[1]?.innerText.trim() || '',
                        section: cells[2]?.innerText.trim() || '',
                        seats: cells[3]?.innerText.trim() || '',
                        title: cells[4]?.querySelector('a')?.innerText.trim() || '',
                        days: cells[5]?.innerText.trim() || '',
                        times: cells[6]?.innerText.trim() || '',
                        instructor: cells[7]?.querySelector('a')?.innerText.trim() || '',
                        location: cells[8]?.innerText.trim() || '',
                        classInfo: cells[9]?.innerText.trim() || ''
                    });
                }
            });

            return tableData;
        });

        // Save department data to JSON file
        const filePath = path.join('classes', `${department}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Saved ${data.length} courses for ${department} to ${filePath}`);

        return data;
    } catch (error) {
        console.error(`Error fetching ${department}:`, error.message);
        return [];
    } finally {
        await browser.close();
    }
}

const fetchAllDepartments = async () => {
    console.log(`Starting to fetch all departments for term ${term}...`);
    
    // Ensure classes directory exists
    if (!fs.existsSync('classes')) {
        fs.mkdirSync('classes');
    }

    for (const department of allDepartments) {
        console.log(`Fetching ${department}...`);
        await fetchDepartment(department);
        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Finished fetching all departments!');
}

// Run once
fetchAllDepartments();

