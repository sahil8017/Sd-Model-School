// Deterministic student generator — same className → same 30 students every time.
// Seed derived from class name char codes so "10-A" always gives the exact same list.

const firstNames = [
  "Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan",
  "Aanya","Diya","Saanvi","Aadhya","Myra","Anika","Navya","Pari","Riya","Sara",
  "Kabir","Dev","Aryan","Rudra","Yuvan","Aarush","Atharv","Veer","Rohan","Karan",
  "Ananya","Ishita","Kavya","Tanya","Mehak","Priya","Simran","Nisha","Ria","Tisha",
  "Harshit","Tanvi","Jiya","Lakshya","Dhruv","Kritika","Mohan","Preet","Sanya","Yash",
];
const lastNames = [
  "Sharma","Verma","Singh","Gupta","Aggarwal","Mehta","Chopra","Kapoor",
  "Bansal","Goyal","Jindal","Sethi","Khurana","Sachdeva","Mittal","Garg",
  "Bhalla","Wadhwa","Dhingra","Khanna","Rana","Malhotra","Jain","Arora",
];
const areas = [
  "Sector 7","Sector 12","Mall Road","Mughal Canal","Old Subzi Mandi","Model Town",
  "Kunjpura Road","Railway Road","Sector 32","Sector 13","Geeta Colony","Anaj Mandi",
  "Sector 6","Sector 4","Civil Lines","GT Road","Taraori Road","Karnal Cantonment",
];
const emailDomains = ["gmail.com","yahoo.com","outlook.com","rediffmail.com"];
const grades       = ["A+","A","B+","B","C"];

function rand(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Shape that maps 1-to-1 with the DB Student document (snake_case)
export type GeneratedStudent = {
  roll_no:               number;
  name:                  string;
  age:                   number;
  address:               string;
  parent_guardian_phone: string;
  parent_email:          string;
  overall_grade:         string;
  class_name:            string;
};

export function getStudentsForClass(className: string): GeneratedStudent[] {
  const r = rand(className.split("").reduce((a, c) => a + c.charCodeAt(0), 1));
  const classNum = parseInt(className.split("-")[0]) || 1;
  const baseAge  = classNum + 5;

  const students: GeneratedStudent[] = [];
  for (let i = 1; i <= 30; i++) {
    const fn      = firstNames[Math.floor(r() * firstNames.length)];
    const ln      = lastNames[Math.floor(r() * lastNames.length)];
    const area    = areas[Math.floor(r() * areas.length)];
    const houseNo = Math.floor(r() * 800) + 1;
    const grade   = grades[Math.floor(r() * grades.length)];
    const phone   = `+91 9${String(Math.floor(r() * 900000000 + 100000000))}`;
    const domain  = emailDomains[Math.floor(r() * emailDomains.length)];
    const email   = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@${domain}`;
    const age     = baseAge + (r() > 0.5 ? 0 : 1);

    students.push({
      roll_no:               i,
      name:                  `${fn} ${ln}`,
      age,
      address:               `H.No. ${houseNo}, ${area}, Karnal`,
      parent_guardian_phone: phone,
      parent_email:          email,
      overall_grade:         grade,
      class_name:            className,
    });
  }
  return students;
}
