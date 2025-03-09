import puppeteer from 'puppeteer';
import cron from 'node-cron';

const term = "S2025"

const targets = [
    {
        department: "CIS",
        crn: "46749",
    },
    {
        department: "PHIL",
        crn: "46582",
    }
]

const fetchList = async () => {
    const departments = targets.map(target => target.department);
    const uniqueDepartments = [...new Set(departments)];
    
    for (const department of uniqueDepartments) {
        const url = `https://www.deanza.edu/schedule/listings.html?dept=${department}&t=${term}`;

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const data = await page.evaluate(() => {
            const rows = document.querySelectorAll('.table-schedule tbody tr');
            const tableData = [];

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
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
            });

            return tableData;
        });

        const targetList = data.filter(course => targets.some(target => target.department === department && target.crn === course.crn));
        for (const target of targetList) {
            if (target.seats == "Open" || target.seats == "WL") {
                const response = await fetch('https://ntfy.mortada.dev/deanza', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain'
                      },
                    body: `Class ${target.course} (${target.title}) is now ${target.seats == "WL" ? "Waitlisted" : "Open"}!`,
                }).then(() => console.log("Notified!"));
            }
        }
        await browser.close();
    }
}

cron.schedule('*/5 * * * *', () => {
    fetchList();
});

