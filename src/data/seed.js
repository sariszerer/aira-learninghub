// Datos semilla. Sirven de respaldo cuando Supabase no devuelve filas y como
// base para el rol de tutor sombra, que no carga de la base.

import { T } from "../theme.js";

export const seedUsers = [
  { id: "u-idaira", name: "Idaira Castillo", role: "clinical_director", specialty: "Terapia Ocupacional · Psicopedagogía", title: "Directora Clínica", avatarBg: "#7FA88A" },
  { id: "u-admin", name: "Sarita Szerer", role: "admin", title: "Directora", avatarBg: T.brand },
  { id: "u-celilia", name: "Celilia Miranda", role: "specialist", specialty: "Terapia Ocupacional", avatarBg: "#6E8FA6" },
  { id: "u-neyma", name: "Neyma Paniagua", role: "specialist", specialty: "Psicología", avatarBg: "#A6779A" },
  { id: "u-milagros", name: "Milagros Batista", role: "specialist", specialty: "Fonoaudiología", avatarBg: "#82A166" },
  { id: "u-ingrid", name: "Ingrid Villa", role: "specialist", specialty: "Fonoaudiología", avatarBg: "#9AA4C4" },
  { id: "u-daniella", name: "Daniella Azrak", role: "specialist", specialty: "Desarrollo (DVLP)", avatarBg: "#C79A6B" },
  { id: "u-mariavirginia", name: "María Virginia Sierralta", role: "specialist", specialty: "Kids Club", avatarBg: "#B58AC7" },
  { id: "u-laura", name: "Laura González", role: "specialist", specialty: "Psicología Clínica", avatarBg: "#9B6B9B" },
  { id: "u-claudia", name: "Claudia Nigrinis", role: "clinical_director", specialty: "Psicología", title: "Directora Clínica", avatarBg: "#C0392B" },
];

export const seedChildren = [
  { id:"c-noha", name:"Noa", lastName:"Levy Attia", birthDate:"2019-07-16", admissionDate:null, specialties:["Desarrollo (DVLP)"], assignedSpecialists:["u-daniella"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Dorit Levy Attia",phone:"66137921",email:""} },
  { id:"c-joseph", name:"Joseph", lastName:"Ben Avi", birthDate:"2014-01-27", admissionDate:null, specialties:["Desarrollo (DVLP)"], assignedSpecialists:["u-daniella"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Evelyn Ben Avi",phone:"66798919",email:""} },
  { id:"c-mili", name:"Mili", lastName:"Tawachi Khafif", birthDate:"2016-11-21", admissionDate:null, specialties:["Desarrollo (DVLP)"], assignedSpecialists:["u-daniella"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Zuby Khafif",phone:"66177371",email:""} },
  { id:"c-charlie", name:"Charlie Yosef", lastName:"Sasportes Eskenazi", birthDate:"2016-01-18", admissionDate:null, specialties:["Fonoaudiología"], assignedSpecialists:["u-ingrid"], avatarBg:T.brand, status:"inactivo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Orly Sasportes",phone:"67478300",email:""} },
  { id:"c-fridaabadi", name:"Frida", lastName:"Abadi", birthDate:"2018-09-13", admissionDate:null, specialties:["Fonoaudiología","Terapia Ocupacional"], assignedSpecialists:["u-ingrid","u-celilia"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Eva Liana",phone:"66167252",email:""} },
  { id:"c-samuell", name:"Samuel", lastName:"Lazar", birthDate:"2020-08-11", admissionDate:null, specialties:["Fonoaudiología"], assignedSpecialists:["u-ingrid"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Michal Lazar",phone:"63975615",email:""} },
  { id:"c-sebastiano", name:"Sebastiano", lastName:"Nataloni", birthDate:"2023-01-07", admissionDate:null, specialties:["Fonoaudiología"], assignedSpecialists:["u-ingrid"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Orlymer Perez",phone:"65704425",email:""} },
  { id:"c-abrahamp", name:"Abraham", lastName:"Pesso", birthDate:"2023-01-10", admissionDate:null, specialties:["Fonoaudiología"], assignedSpecialists:["u-milagros"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Shirley Pesso",phone:"66761188",email:""} },
  { id:"c-joel", name:"Joel Nessim", lastName:"Amar Israel", birthDate:"2021-01-19", admissionDate:null, specialties:["Fonoaudiología"], assignedSpecialists:["u-milagros"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Jen Israel de Amar",phone:"67474375",email:""} },
  { id:"c-lily", name:"Lily", lastName:"Bassan Szerer", birthDate:"2018-01-08", admissionDate:null, specialties:["Fonoaudiología"], assignedSpecialists:["u-milagros"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Sarita Bassan",phone:"69487740",email:""} },
  { id:"c-alessandra", name:"Alessandra", lastName:"Benaim Landman", birthDate:"2010-10-12", admissionDate:null, specialties:["Psicología"], assignedSpecialists:["u-neyma"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Alice Benaim",phone:"66797798",email:""} },
  { id:"c-gabriel", name:"Gabriel", lastName:"Velásquez Páez", birthDate:"2011-07-05", admissionDate:null, specialties:["Psicología"], assignedSpecialists:["u-neyma"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Orlymer Perez",phone:"65704425",email:""} },
  { id:"c-rafael", name:"Rafael", lastName:"Ben-Avi Rosental", birthDate:"2018-12-23", admissionDate:null, specialties:["Psicología"], assignedSpecialists:["u-neyma"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Yael Ben Avi",phone:"66797805",email:""} },
  { id:"c-nissimmilhen", name:"Nissim Joseph", lastName:"Cohen Milhem", birthDate:"2015-11-25", admissionDate:null, specialties:["Psicología"], assignedSpecialists:["u-neyma"], avatarBg:T.brand, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Nicolle Milhen",phone:"66149000",email:""} },
  { id:"c-nessim", name:"Nessim", lastName:"Guindi Bassan", birthDate:"2018-06-13", admissionDate:null, specialties:["Psicología","Terapia Ocupacional"], assignedSpecialists:["u-neyma","u-celilia"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Frida Guindi Bassan",phone:"66139408",email:""} },
  { id:"c-eduardon", name:"Eduardo", lastName:"Nessim", birthDate:"2018-07-05", admissionDate:null, specialties:["Kids Club"], assignedSpecialists:["u-mariavirginia"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Grace Nessim",phone:"66708487",email:""} },
  { id:"c-edy", name:"Edy", lastName:"Antebi", birthDate:"2020-06-20", admissionDate:null, specialties:["Kids Club","Desarrollo (DVLP)"], assignedSpecialists:["u-mariavirginia","u-daniella"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Natalie Antebi",phone:"67811255",email:""} },
  { id:"c-eliahu", name:"Eliahu", lastName:"Guindi Zayat", birthDate:"2019-08-06", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Adela Guindi",phone:"67819400",email:""} },
  { id:"c-abrahaml", name:"Abraham Nathan", lastName:"Levy Weinberg", birthDate:"2020-12-01", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.pink, status:"inactivo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Tony Levy",phone:"66163324",email:""} },
  { id:"c-sam", name:"Sam", lastName:"Mizrachi", birthDate:"2016-05-11", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Hilda Mizrachi",phone:"66166171",email:""} },
  { id:"c-moshe", name:"Moshe", lastName:"Mizrachi", birthDate:"2016-05-11", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Hilda Mizrachi",phone:"66166171",email:""} },
  { id:"c-leo", name:"Leo", lastName:"Coleman Bergantino", birthDate:"2023-01-13", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Karen Bergantino",phone:"65505706",email:""} },
  { id:"c-binyamin", name:"Binyamin", lastName:"Lowfer", birthDate:"2022-06-11", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.brand, status:"inactivo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Diana Gabay",phone:"69484830",email:""} },
  { id:"c-shella", name:"Shella", lastName:"Naftali Hanono", birthDate:"2021-12-02", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Bella Hanono",phone:"69368822",email:""} },
  { id:"c-gabrielm", name:"Gabriel", lastName:"Mendelson Shabanov", birthDate:"2024-03-24", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Raquel Shabanov",phone:"62468888",email:""} },
  { id:"c-ellis", name:"Ellis", lastName:"Benoliel", birthDate:"2019-02-28", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Denisse Yohoros",phone:"65506363",email:""} },
  { id:"c-milan", name:"Milan", lastName:"Vainstein", birthDate:"2021-04-21", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Amit Vainstein",phone:"63133224",email:""} },
  { id:"c-haim", name:"Haim", lastName:"Roizental", birthDate:"2021-04-02", admissionDate:null, specialties:["Terapia Ocupacional","Funciones Ejecutivas","Fonoaudiología"], assignedSpecialists:["u-celilia","u-admin","u-ingrid"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Ivonne Roizental",phone:"60600223",email:""} },
  { id:"c-samson", name:"Samson", lastName:"Hutman Bodie", birthDate:"2020-05-16", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Brette Hutman",phone:"64302988",email:""} },
  { id:"c-jonathan", name:"Jonathan", lastName:"Salomon", birthDate:"2018-08-20", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Ariela Salomon",phone:"66748144",email:""} },
  { id:"c-elias", name:"Elias", lastName:"Amar", birthDate:"2019-02-22", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.brand, status:"inactivo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Violeta Soued",phone:"66175471",email:""} },
  { id:"c-gila", name:"Gila", lastName:"Falic Kardonski", birthDate:"2023-01-18", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Dorita Falic",phone:"64504791",email:""} },
  { id:"c-dorita", name:"Dorita", lastName:"Levy", birthDate:"2017-02-07", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Karen Levi",phone:"66734520",email:""} },
  { id:"c-haimbenavi", name:"Haim", lastName:"Ben-Avi", birthDate:"2020-11-24", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Yael Ben Avi",phone:"66797805",email:""} },
  { id:"c-isaac", name:"Isaac", lastName:"Schachtel", birthDate:"2022-12-29", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-celilia"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Diana Schachtel",phone:"61127386",email:""} },
  { id:"c-nathalie", name:"Natalie", lastName:"Azrak Schachtel", birthDate:"2015-06-14", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-idaira"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Joanna Schachtel",phone:"66750311",email:""} },
  { id:"c-jonathanb", name:"Jonathan", lastName:"Ben Avi", birthDate:"2019-04-22", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-idaira"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Evelyn Ben Avi",phone:"66798919",email:""} },
  { id:"c-atai", name:"Atai", lastName:"Levin Pion", birthDate:"2017-08-04", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-idaira"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Pninit Levin",phone:"60709159",email:""} },
  { id:"c-benjamin", name:"Benjamin", lastName:"Betesh", birthDate:"2023-06-18", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-idaira"], avatarBg:T.brand, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Joann Vega",phone:"66712819",email:""} },
  { id:"c-helena", name:"Helena", lastName:"Btesh", birthDate:"2021-09-03", admissionDate:null, specialties:["Terapia Ocupacional","Desarrollo (DVLP)"], assignedSpecialists:["u-idaira","u-daniella"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Monique Btesh",phone:"66739454",email:""} },
  { id:"c-johan", name:"Jonah", lastName:"Hamoui Fefer", birthDate:"2019-09-05", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-idaira"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Jeny Hamoui",phone:"8184456377",email:""} },
  { id:"c-asher", name:"Asher", lastName:"Btesh", birthDate:"2020-02-10", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-idaira"], avatarBg:T.brandBright, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Monique Btesh",phone:"66739454",email:""} },
  { id:"c-rafaelpc", name:"Rafael", lastName:"Ben Avi Bassan", birthDate:"2013-08-16", admissionDate:null, specialties:["Terapia Ocupacional"], assignedSpecialists:["u-idaira"], avatarBg:T.pink, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Sara Bassan",phone:"66721580",email:""} },
  { id:"c-shoshana", name:"Shoshana Aviva", lastName:"Malka Abbo", birthDate:"2018-08-08", admissionDate:null, specialties:["Terapia Ocupacional","Desarrollo (DVLP)"], assignedSpecialists:["u-idaira","u-daniella"], avatarBg:T.amber, status:"activo", nextSession:null, nextSessionTime:null, packageNum:1, packageStart:null, parentContact:{name:"Luisa Abbo",phone:"60600222",email:""} },
];

export const seedObjectives = [
  { id: "o-edy1", childId: "c-edy", name: "Regulación emocional", area: "Desarrollo (DVLP)", createdDate: "2026-01-12", specialistId: "u-daniella", status: "proceso" },
  { id: "o-edy2", childId: "c-edy", name: "Tolerancia a la frustración", area: "Desarrollo (DVLP)", createdDate: "2026-01-12", specialistId: "u-daniella", status: "proceso" },
  { id: "o-edy3", childId: "c-edy", name: "Flexibilidad cognitiva", area: "Kids Club", createdDate: "2026-01-12", specialistId: "u-mariavirginia", status: "proceso" },
  { id: "o-edy4", childId: "c-edy", name: "Comunicación asertiva", area: "Kids Club", createdDate: "2026-01-12", specialistId: "u-mariavirginia", status: "proceso" },

  { id: "o-atai1", childId: "c-atai", name: "Control de impulsos", area: "Psicología", createdDate: "2026-01-06", specialistId: "u-neyma", status: "proceso" },
  { id: "o-atai2", childId: "c-atai", name: "Comunicación efectiva", area: "Psicología", createdDate: "2026-01-06", specialistId: "u-neyma", status: "proceso" },
  { id: "o-atai3", childId: "c-atai", name: "Manejo conductual en el colegio", area: "Psicología", createdDate: "2026-01-06", specialistId: "u-neyma", status: "apoyo" },

  { id: "o-elias1", childId: "c-elias", name: "Habilidades sociales", area: "Desarrollo (DVLP)", createdDate: "2025-11-06", specialistId: "u-daniella", status: "proceso" },
  { id: "o-elias2", childId: "c-elias", name: "Atención sostenida", area: "Desarrollo (DVLP)", createdDate: "2025-11-06", specialistId: "u-daniella", status: "apoyo" },

  { id: "o-gabriel1", childId: "c-gabriel", name: "Construcción de identidad", area: "Psicología", createdDate: "2026-07-06", specialistId: "u-neyma", status: "proceso" },
  { id: "o-gabriel2", childId: "c-gabriel", name: "Autoconocimiento (intereses y metas)", area: "Psicología", createdDate: "2026-07-06", specialistId: "u-neyma", status: "proceso" },
  { id: "o-gabriel3", childId: "c-gabriel", name: "Análisis de consecuencias de decisiones", area: "Psicología", createdDate: "2026-07-06", specialistId: "u-neyma", status: "proceso" },

  { id: "o-rafael1", childId: "c-rafael", name: "Autorregulación emocional", area: "Psicología", createdDate: "2025-10-29", specialistId: "u-neyma", status: "proceso" },
  { id: "o-rafael2", childId: "c-rafael", name: "Autoestima y seguridad personal", area: "Psicología", createdDate: "2025-10-29", specialistId: "u-neyma", status: "proceso" },
  { id: "o-rafael3", childId: "c-rafael", name: "Independencia y estrategias de afrontamiento", area: "Psicología", createdDate: "2025-10-29", specialistId: "u-neyma", status: "proceso" },

  { id: "o-abg1", childId: "c-abrahamg", name: "Expresión asertiva de necesidades", area: "Psicología", createdDate: "2026-03-26", specialistId: "u-neyma", status: "proceso" },
  { id: "o-abg2", childId: "c-abrahamg", name: "Regulación ante estímulos sensoriales", area: "Psicología", createdDate: "2026-03-26", specialistId: "u-neyma", status: "apoyo" },

  { id: "o-ale1", childId: "c-alessandra", name: "Adaptación al proceso de mudanza", area: "Psicología", createdDate: "2026-08-05", specialistId: "u-neyma", status: "proceso" },
  { id: "o-ale2", childId: "c-alessandra", name: "Manejo de conductas compulsivas", area: "Psicología", createdDate: "2026-08-05", specialistId: "u-neyma", status: "apoyo" },
  { id: "o-ale3", childId: "c-alessandra", name: "Confianza en la toma de decisiones", area: "Psicología", createdDate: "2026-08-05", specialistId: "u-neyma", status: "proceso" },

  { id: "o-ellis1", childId: "c-ellis", name: "Atención sostenida", area: "Terapia Ocupacional", createdDate: "2026-03-20", specialistId: "u-celilia", status: "apoyo" },
  { id: "o-ellis2", childId: "c-ellis", name: "Integración visomotora", area: "Terapia Ocupacional", createdDate: "2026-03-20", specialistId: "u-celilia", status: "proceso" },
  { id: "o-ellis3", childId: "c-ellis", name: "Coordinación motriz fina", area: "Terapia Ocupacional", createdDate: "2026-03-20", specialistId: "u-celilia", status: "apoyo" },
  { id: "o-ellis4", childId: "c-ellis", name: "Decodificación lectora", area: "Terapia Ocupacional", createdDate: "2026-03-20", specialistId: "u-celilia", status: "proceso" },

  { id: "o-yon1", childId: "c-yonatan", name: "Integración visomotora", area: "Terapia Ocupacional", createdDate: "2026-03-10", specialistId: "u-celilia", status: "apoyo" },
  { id: "o-yon2", childId: "c-yonatan", name: "Coordinación motriz fina", area: "Terapia Ocupacional", createdDate: "2026-03-10", specialistId: "u-celilia", status: "apoyo" },
  { id: "o-yon3", childId: "c-yonatan", name: "Atención sostenida", area: "Terapia Ocupacional", createdDate: "2026-03-10", specialistId: "u-celilia", status: "proceso" },

  { id: "o-nes1", childId: "c-nessim", name: "Integración visomotora", area: "Terapia Ocupacional", createdDate: "2025-11-12", specialistId: "u-celilia", status: "apoyo" },
  { id: "o-nes2", childId: "c-nessim", name: "Control de fuerza y agarre del lápiz", area: "Terapia Ocupacional", createdDate: "2025-11-12", specialistId: "u-celilia", status: "proceso" },
  { id: "o-nes3", childId: "c-nessim", name: "Tolerancia a cambios de actividad", area: "Terapia Ocupacional", createdDate: "2025-11-12", specialistId: "u-celilia", status: "proceso" },

  { id: "o-abl1", childId: "c-abrahaml", name: "Procesamiento sensorial táctil", area: "Terapia Ocupacional", createdDate: "2026-07-23", specialistId: "u-celilia", status: "apoyo" },
  { id: "o-abl2", childId: "c-abrahaml", name: "Coordinación motora fina", area: "Terapia Ocupacional", createdDate: "2026-07-23", specialistId: "u-celilia", status: "apoyo" },
  { id: "o-abl3", childId: "c-abrahaml", name: "Seguimiento de consignas", area: "Terapia Ocupacional", createdDate: "2026-07-23", specialistId: "u-celilia", status: "proceso" },

  { id: "o-jos1", childId: "c-joseph", name: "Organización y planificación", area: "Desarrollo (DVLP)", createdDate: "2025-12-24", specialistId: "u-daniella", status: "proceso" },
  { id: "o-jos2", childId: "c-joseph", name: "Autonomía funcional", area: "Desarrollo (DVLP)", createdDate: "2025-12-24", specialistId: "u-daniella", status: "apoyo" },
  { id: "o-jos3", childId: "c-joseph", name: "Manejo de ansiedad relacionada a su salud", area: "Desarrollo (DVLP)", createdDate: "2025-12-24", specialistId: "u-daniella", status: "proceso" },
];

export const seedSessions = [
  {
    id: "s-edy1", childId: "c-edy", specialistId: "u-mariavirginia", specialty: "Kids Club",
    date: "2026-07-02", duration: 45,
    objectivesWorked: [
      { objectiveId: "o-edy4", status: "proceso" },
      { objectiveId: "o-edy3", status: "proceso" },
      { objectiveId: "o-edy1", status: "proceso" },
    ],
    activities: ["Búsqueda de objetos en hoja", "Juego de solo respuestas incorrectas", "Juego UNO"],
    observation: "Edy mostró una respuesta positiva ante situaciones de frustración. Cuando una actividad representó un desafío, solicitó ayuda de manera adecuada en lugar de rendirse. Al perder en un juego, logró aceptar el resultado y pidió iniciar una nueva partida sin molestias. Disminuyó la necesidad de preguntar por la hora, mostrando mayor permanencia en las actividades.",
    nextSteps: "Continuar fortaleciendo la tolerancia a la frustración mediante juegos donde deba esperar turnos y enfrentar pequeños desafíos. Reforzar frases como \"¿Me ayudas?\" o \"Lo intentaré de otra forma\".",
    createdAt: "2026-07-02T17:45:00",
  },
];

export const seedDocuments = [
  {
    id: "d-edy1", childId: "c-edy", type: "anamnesis", title: "Anamnesis inicial",
    date: "2026-01-12", authorId: "u-neyma",
    notes: "Consulta por dificultades en la regulación emocional, baja tolerancia a la frustración y conductas desafiantes cuando las situaciones no coinciden con sus expectativas. Dificultad para saludar, aceptar correcciones y expresar verbalmente emociones o necesidades, tanto en el hogar como en el colegio. Desarrollo temprano con gateo e inicio de marcha tardíos; buen estado de salud general. Se observa que el hermano mayor y el menor suelen jugar juntos, dejando a Edy fuera de la dinámica en algunos momentos, lo cual podría influir en su búsqueda de atención.",
  },
  {
    id: "d-edy2", childId: "c-edy", type: "informe", title: "Informe de cierre — proceso DVLP (12 sesiones)",
    date: "2026-06-28", authorId: "u-daniella",
    notes: "Duración del proceso: 12 sesiones, 2 veces por semana. Objetivo: fortalecer autorregulación emocional, flexibilidad cognitiva y seguridad personal. Al inicio tendía a rendirse rápidamente, desconectarse ante lo que no le gustaba y buscar mucha validación externa. Con el proceso mostró mayor disposición a participar, más tolerancia a la frustración con acompañamiento y mayor apertura a intentar nuevamente. Objetivos alcanzados parcialmente, con avances importantes en regulación y disposición emocional. Se recomienda continuar trabajando seguridad en sus respuestas, regulación emocional, flexibilidad cognitiva y tolerancia al aburrimiento.",
  },
  {
    id: "d-atai1", childId: "c-atai", type: "anamnesis", title: "Ficha de anamnesis breve",
    date: "2026-01-06", authorId: "u-neyma",
    notes: "El colegio reporta dificultades conductuales: falta de respeto, conductas impulsivas y reactivas frente a conflictos con pares, y tendencia a \"castigar\" a compañeros cuando siente que le han fallado. Tres años consecutivos con buen rendimiento académico. Desarrollo dentro de parámetros normales. Evaluación previa con Ortal Pinto hace aproximadamente un año. Vive con ambos padres y una hermana mayor. Evento escolar relevante: incidente de fin de año que derivó en suspensión; reconoció el error tras el hecho.",
  },
  {
    id: "d-elias1", childId: "c-elias", type: "anamnesis", title: "Ficha de anamnesis breve",
    date: "2025-11-06", authorId: "u-daniella",
    notes: "Recibió previamente Terapia Ocupacional en Brain Tools, donde fue dado de alta; se recomendó continuar con intervención psicopedagógica. La principal preocupación de la familia es el desarrollo de habilidades sociales más que los desafíos académicos. Desarrollo temprano normal. Se expresa muy bien; presenta berrinches cuando se le dice que no. Segundo de tres hermanos; nació un hermanito hace aproximadamente un año, lo que generó cambios en la dinámica familiar. Antecedente familiar de ansiedad y posible TOC a considerar.",
  },
  {
    id: "d-gabriel1", childId: "c-gabriel", type: "anamnesis", title: "Anamnesis — Niños y Adolescentes",
    date: "2026-07-06", authorId: "u-neyma",
    notes: "La madre busca fortalecer la construcción de identidad de Gabriel, el reconocimiento de sus intereses, valores y metas, y una mayor capacidad para analizar consecuencias de sus decisiones. Vive con su madre, la pareja de ella y su hermano menor. El padre biológico no participa en su vida. Ha presentado conflictos interpersonales y una suspensión escolar por agresión física; actúa de forma impulsiva sin valorar consecuencias. Migró de Venezuela a Panamá alrededor de los 6 años.",
  },
  {
    id: "d-rafael1", childId: "c-rafael", type: "anamnesis", title: "Anamnesis — Niños y Adolescentes",
    date: "2025-10-29", authorId: "u-neyma",
    notes: "Los padres buscan acompañamiento para apoyar a Rafael en su adaptación emocional ante una condición cardíaca congénita (hipoplasia del ventrículo izquierdo), cirugías realizadas y uso de marcapasos. Presenta hipersensibilidad, estado de alerta constante y dificultades en su desarrollo social. Buen desarrollo cognitivo; en ocasiones no sigue indicaciones y presenta hipersensibilidad emocional. Toma Aspirina, Metoprolol y Levotiroxina. Recibió TCC hace aproximadamente 6 meses.",
  },
  {
    id: "d-abg1", childId: "c-abrahamg", type: "anamnesis", title: "Anamnesis — Niños y Adolescentes",
    date: "2026-03-26", authorId: "u-neyma",
    notes: "La madre refiere alta sensibilidad ante gritos y música alta, que le generan marcado malestar; conductas asociadas a ansiedad como morderse el cuello del suéter y babeo. Se queja con frecuencia de la escuela. Desea que aprenda a expresar sus necesidades y a defenderse de manera asertiva. Vive con ambos padres y tres hermanos. Buen desempeño escolar general, con resistencia ocasional a tareas.",
  },
  {
    id: "d-ale1", childId: "c-alessandra", type: "anamnesis", title: "Anamnesis — Niños y Adolescentes",
    date: "2026-08-05", authorId: "u-neyma",
    notes: "Los padres buscan apoyo para la adaptación de Alessandra a una mudanza familiar a EE.UU. en aproximadamente un año. La describen como rígida, puntual e inmadura para su edad. Presenta conductas compulsivas o repetitivas (entrar y salir de un lugar varias veces, cambiarse de ropa repetidamente) que se han intensificado recientemente. Madre con diagnóstico de ansiedad. Rechaza firmemente la idea de la mudanza; actualmente no está de acuerdo con asistir a terapia.",
  },
  {
    id: "d-ellis1", childId: "c-ellis", type: "evaluacion", title: "Evaluación de Terapia Ocupacional",
    date: "2026-03-20", authorId: "u-celilia",
    notes: "Motivo: dificultades en atención sostenida, tendencia a la impulsividad y dificultad para mantenerse tranquilo en actividades estructuradas. Test de Berry (VMI): Integración Visomotora promedio bajo (85), Percepción Visual promedio (104), Coordinación Motriz muy bajo (66). Motricidad fina con agarre cuadrípode dinámico y compensación postural. Aún no logra amarrar cordones. Requiere reforzar sílabas trabadas en lectura.",
  },
  {
    id: "d-yon1", childId: "c-yonatan", type: "evaluacion", title: "Evaluación de Terapia Ocupacional",
    date: "2026-03-10", authorId: "u-celilia",
    notes: "Motivo: reacciones emocionales intensas ante cambios de rutina, necesidad frecuente de movimiento e impulsividad. Test de Berry (VMI): Integración Visomotora promedio bajo (82), Percepción Visual promedio (101), Coordinación Motriz bajo-promedio (86). Movimientos orales asociados durante tareas grafomotoras. Dominancia diestra consolidada, lectura fluida. Requiere reforzar precisión grafomotora y organización espacial.",
  },
  {
    id: "d-nes1", childId: "c-nessim", type: "evaluacion", title: "Evaluación de Terapia Ocupacional",
    date: "2025-11-12", authorId: "u-celilia",
    notes: "Desarrollo por debajo de lo esperado en integración visomotora. Agarre cuadrípode dinámico variable; aplica fuerza excesiva al escribir; macroescritura. Muestra oposición o frustración cuando debe realizar actividades fuera de su interés inmediato, y búsqueda constante de movimiento. Independiente en autocuidado, con resistencia a rutinas establecidas. Se recomienda TO 2 veces por semana durante 12 sesiones.",
  },
  {
    id: "d-abl1", childId: "c-abrahaml", type: "evaluacion", title: "Evaluación de Terapia Ocupacional",
    date: "2026-07-23", authorId: "u-celilia",
    notes: "Motivo: dificultad para tolerar el agua cerca de los ojos durante higiene personal, y baja tolerancia al contacto físico inesperado. Test VMI: Integración Visomotora promedio (92), Percepción Visual promedio (109), Coordinación Motora muy bajo (67). Indicadores de dificultad en modulación de estímulos táctiles; responde mejor cuando las experiencias táctiles se presentan de forma gradual y anticipada, a través del juego.",
  },
  {
    id: "d-jos1", childId: "c-joseph", type: "anamnesis", title: "Ficha de anamnesis breve",
    date: "2025-12-24", authorId: "u-daniella",
    notes: "Motivo: dificultades en organización, planificación y autonomía funcional; antecedente de ansiedad en mejoría; diagnóstico de Diabetes Tipo I (dic. 2021) con uso de insulina y monitor de glucosa. Le cuesta notar cuando se ensucia y amarrarse los zapatos. Miedo a que la medicina le caiga mal; ansiedad relacionada con la comida y el futuro. Se distrae con facilidad en clase. Se ofrecerá el programa Adventures in Wisdom (DVLP).",
  },
];

export const seedMeetings = [];

export const seedParentReports = [];

// ── Tutores AIRA (tutores en escuela) ─────────────────────────────────────────────
export const seedTutors = [
  {
    id: "sh-ejemplo", name: "María (Tutora AIRA)", role: "shadow",
    assignedChildId: "c-edy", school: "Colegio Ejemplo",
    avatarBg: "#C49A8A", startDate: "2026-08-01",
  },
];

// ── Gabinete externo ─────────────────────────────────────────────────────────
export const seedSchools = [
  {
    id: "sch-ejemplo", name: "Colegio Ejemplo",
    contact: "Directora: Ejemplo", phone: "", email: "",
    contractStart: "2026-08-01", contractEnd: "2027-06-30",
    assignedSpecialists: ["u-celilia", "u-neyma"],
    specialty: "Terapia Ocupacional · Psicología",
    students: [],
    notes: "Gabinete de prueba. Editar con datos reales.",
  },
];

export const seedGabineteSessions = [];

// ── Shadow reports (quincenal) ───────────────────────────────────────────────
export const seedTutorReports = [];
