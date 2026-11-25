import {TeaType, ToppingId, ToppingOption, WaterTemp} from '../types/tea';

export const WATER_TEMPS: {
  id: WaterTemp;
  tempC: number;
  label: string;
  hint: string;
}[] = [
  {
    id: 'warm',
    tempC: 75,
    label: 'น้ำอุ่น 75°C',
    hint: 'อ่อนโยน เหมาะกับชาเขียวและชามัทฉะ',
  },
  {
    id: 'hot',
    tempC: 85,
    label: 'น้ำร้อน 85°C',
    hint: 'สมดุล เหมาะกับอู่หลงและชาดอกไม้',
  },
  {
    id: 'boiling',
    tempC: 95,
    label: 'น้ำเดือด 95°C',
    hint: 'ปลุกกลิ่นเข้ม เหมาะกับชาดำและชาไทย',
  },
];

export const TOPPINGS: ToppingOption[] = [
  {
    id: 'honey',
    name: 'น้ำผึ้งป่า',
    shortNote: 'หวานหอมนุ่มละมุน',
    swatch: '#D99B26',
  },
  {
    id: 'milk',
    name: 'นมสดอุ่น',
    shortNote: 'เนื้อนวล กลมกล่อม',
    swatch: '#F3ECE0',
  },
  {
    id: 'ice',
    name: 'น้ำแข็งก้อน',
    shortNote: 'เย็นสดชื่น ชุ่มคอ',
    swatch: '#CFE4EC',
  },
  {
    id: 'lemon',
    name: 'เลมอนฝาน',
    shortNote: 'เปรี้ยวหอม ตัดเลี่ยน',
    swatch: '#EBD35B',
  },
  {
    id: 'osmanthus',
    name: 'ดอกหอมหมื่นลี้',
    shortNote: 'กลิ่นดอกไม้ชวนผ่อนคลาย',
    swatch: '#E5B24C',
  },
];

export const TEAS: TeaType[] = [
  // === 1. ชามัทฉะ (Multiple Matcha Varieties) ===
  {
    id: 'kyoto-matcha',
    name: 'มัทฉะเกียวโต',
    englishName: 'Kyoto Ceremonial Matcha',
    category: 'matcha',
    categoryLabel: 'ชามัทฉะ',
    unlockLevel: 1,
    origin: 'อูจิ · เกียวโต',
    harvestSeason: 'ยอดชาฤดูใบไม้ผลิ',
    caffeineLevel: 'ปานกลาง',
    idealTemp: 'warm',
    idealTempLabel: '75°C',
    idealSteepMin: 2.5,
    idealSteepMax: 5.5,
    lightColor: '#8FB56F',
    richColor: '#4E823C',
    deepColor: '#365D28',
    milkColor: '#88B173',
    aromaNote: 'อูมามิเข้มข้น นุ่มละมุนไม่ฝาด',
    description:
      'มัทฉะเกรดพิธีชงบดโม่หินจากใบเทนฉะ คลุมร่มเงาก่อนเก็บเกี่ยวจึงได้สีเขียวมรกตสด',
    flavorProfile: {aroma: 5, sweetness: 4, body: 4},
    recommendedToppings: ['milk'],
    leafShape: 'powder',
    vesselStyle: 'chawan',
  },
  {
    id: 'uji-roasted-matcha',
    name: 'มัทฉะคั่วอุจิ',
    englishName: 'Uji Roasted Matcha',
    category: 'matcha',
    categoryLabel: 'ชามัทฉะ',
    unlockLevel: 2,
    origin: 'อุจิ · ญี่ปุ่น',
    harvestSeason: 'เก็บเกี่ยวกลางฤดู',
    caffeineLevel: 'อ่อน',
    idealTemp: 'hot',
    idealTempLabel: '85°C',
    idealSteepMin: 3.0,
    idealSteepMax: 6.0,
    lightColor: '#A8946B',
    richColor: '#7C6643',
    deepColor: '#58452A',
    milkColor: '#BBA584',
    aromaNote: 'หอมคั่วถั่วและคาราเมลอุ่นๆ',
    description:
      'นำใบชามาคั่วไฟอ่อนก่อนบดละเอียด ให้กลิ่นหอมคล้ายโกโก้และถั่วคั่ว ดื่มง่ายสบายท้อง',
    flavorProfile: {aroma: 5, sweetness: 3, body: 5},
    recommendedToppings: ['milk', 'honey'],
    leafShape: 'powder',
    vesselStyle: 'chawan',
  },
  {
    id: 'sakura-matcha',
    name: 'มัทฉะซากุระ',
    englishName: 'Sakura Spring Matcha',
    category: 'matcha',
    categoryLabel: 'ชามัทฉะ',
    unlockLevel: 5,
    origin: 'ชิซุโอกะ · ญี่ปุ่น',
    harvestSeason: 'ฤดูดอกซากุระบาน',
    caffeineLevel: 'ปานกลาง',
    idealTemp: 'warm',
    idealTempLabel: '75°C',
    idealSteepMin: 2.5,
    idealSteepMax: 5.5,
    lightColor: '#A9C28E',
    richColor: '#6D985B',
    deepColor: '#4E7541',
    milkColor: '#C9B3A9',
    aromaNote: 'หอมใบซากุระอ่อน หวานนวลปลายลิ้น',
    description:
      'มัทฉะยอดอ่อนผสานกลิ่นกลีบซากุระหมักเกลือบางเบา เหมาะกับช่วงเวลายามบ่ายอันสงบ',
    flavorProfile: {aroma: 5, sweetness: 5, body: 3},
    recommendedToppings: ['milk', 'osmanthus'],
    leafShape: 'powder',
    vesselStyle: 'chawan',
  },

  // === 2. ชาเขียว (Green Tea) ===
  {
    id: 'spring-sencha',
    name: 'เซนฉะยอดอ่อน',
    englishName: 'Spring Sencha',
    category: 'green',
    categoryLabel: 'ชาเขียว',
    unlockLevel: 1,
    origin: 'ชิซุโอกะ · ญี่ปุ่น',
    harvestSeason: 'ใบชาแรกผลิ',
    caffeineLevel: 'อ่อน',
    idealTemp: 'warm',
    idealTempLabel: '75°C',
    idealSteepMin: 2.5,
    idealSteepMax: 5.5,
    lightColor: '#C9D89C',
    richColor: '#95B566',
    deepColor: '#6D8D45',
    aromaNote: 'สดชื่น หอมใบหญ้าอ่อน',
    description:
      'ใบชาเขียวนึ่งเรียวสวย รสใสสะอาด ดื่มง่ายสบายท้องทั้งแบบร้อนและใส่น้ำแข็ง',
    flavorProfile: {aroma: 4, sweetness: 3, body: 2},
    recommendedToppings: ['ice'],
    leafShape: 'needle',
    vesselStyle: 'ceramic',
  },
  {
    id: 'gyokuro-green',
    name: 'เกียวคุโระ',
    englishName: 'Gyokuro Shade-Grown',
    category: 'green',
    categoryLabel: 'ชาเขียว',
    unlockLevel: 3,
    origin: 'ยาเมะ · ฟุกุโอกะ',
    harvestSeason: 'คลุมแสง 20 วัน',
    caffeineLevel: 'ปานกลาง',
    idealTemp: 'warm',
    idealTempLabel: '75°C',
    idealSteepMin: 3.0,
    idealSteepMax: 6.0,
    lightColor: '#BFD69D',
    richColor: '#7EA85B',
    deepColor: '#567E3B',
    aromaNote: 'หวานฉ่ำอูมามิ ละมุนลึก',
    description:
      'ราชาแห่งชาเขียวใบญี่ปุ่น คลุมพรางแสงแดดเพื่อกักเก็บความหวานตามธรรมชาติในยอดชา',
    flavorProfile: {aroma: 5, sweetness: 5, body: 3},
    recommendedToppings: ['ice'],
    leafShape: 'needle',
    vesselStyle: 'ceramic',
  },
  {
    id: 'hojicha-green',
    name: 'โฮจิฉะคั่วหอม',
    englishName: 'Roasted Hojicha',
    category: 'green',
    categoryLabel: 'ชาเขียว',
    unlockLevel: 4,
    origin: 'เกียวโต · ญี่ปุ่น',
    harvestSeason: 'ใบชาปลายฤดูคั่ว',
    caffeineLevel: 'อ่อน',
    idealTemp: 'boiling',
    idealTempLabel: '95°C',
    idealSteepMin: 3.0,
    idealSteepMax: 6.0,
    lightColor: '#D6B17C',
    richColor: '#A9733C',
    deepColor: '#7A4D22',
    milkColor: '#C9A47D',
    aromaNote: 'หอมกลิ่นไม้คั่ว ผ่อนคลายก่อนนอน',
    description:
      'ชาเขียวคั่วบนเตาถ่านจนได้สีอำพันและคาเฟอีนต่ำ ให้กลิ่นหอมอบอุ่นเหมือนนั่งผิงไฟ',
    flavorProfile: {aroma: 5, sweetness: 3, body: 3},
    recommendedToppings: ['milk', 'honey'],
    leafShape: 'broken',
    vesselStyle: 'ceramic',
  },

  // === 3. ชาอู่หลง (Oolong Tea) ===
  {
    id: 'dongding-oolong',
    name: 'อู่หลงต้งติ่ง',
    englishName: 'Dong Ding Oolong',
    category: 'oolong',
    categoryLabel: 'ชาอู่หลง',
    unlockLevel: 1,
    origin: 'หนานโถว · ไต้หวัน',
    harvestSeason: 'ยอดเขาสูงฤดูหนาว',
    caffeineLevel: 'ปานกลาง',
    idealTemp: 'hot',
    idealTempLabel: '85°C',
    idealSteepMin: 3.5,
    idealSteepMax: 6.5,
    lightColor: '#E8CC88',
    richColor: '#D1993E',
    deepColor: '#A67022',
    aromaNote: 'หอมคั่วอ่อน หวานชุ่มคอ',
    description:
      'เม็ดชาม้วนกลมที่คลี่ตัวในน้ำร้อน ให้สีทองอำพันและกลิ่นคั่วอบอุ่นชวนจิบยาวๆ',
    flavorProfile: {aroma: 4, sweetness: 4, body: 4},
    recommendedToppings: ['honey'],
    leafShape: 'rolled',
    vesselStyle: 'ceramic',
  },
  {
    id: 'osmanthus-oolong',
    name: 'ชาหอมหมื่นลี้',
    englishName: 'Osmanthus Oolong',
    category: 'oolong',
    categoryLabel: 'ชาอู่หลง',
    unlockLevel: 2,
    origin: 'อาลีซาน · ไต้หวัน',
    harvestSeason: 'ฤดูใบไม้ร่วง',
    caffeineLevel: 'อ่อน',
    idealTemp: 'hot',
    idealTempLabel: '85°C',
    idealSteepMin: 3.0,
    idealSteepMax: 6.0,
    lightColor: '#EFE0A2',
    richColor: '#DFB153',
    deepColor: '#BA872D',
    aromaNote: 'หอมดอกไม้หวานละมุน',
    description:
      'ชาอู่หลงอบกลิ่นดอกกุ้ยฮวา ให้ความรู้สึกเหมือนนั่งใต้ต้นไม้หอมยามบ่าย',
    flavorProfile: {aroma: 5, sweetness: 4, body: 3},
    recommendedToppings: ['osmanthus', 'honey'],
    leafShape: 'rolled',
    vesselStyle: 'ceramic',
  },
  {
    id: 'tieguanyin-oolong',
    name: 'ทิกวนอิม',
    englishName: 'Tieguanyin Oolong',
    category: 'oolong',
    categoryLabel: 'ชาอู่หลง',
    unlockLevel: 5,
    origin: 'อานซี · ฝูเจี้ยน',
    harvestSeason: 'เก็บเกี่ยวใบไม้ผลิ',
    caffeineLevel: 'ปานกลาง',
    idealTemp: 'hot',
    idealTempLabel: '85°C',
    idealSteepMin: 3.5,
    idealSteepMax: 6.5,
    lightColor: '#E9D38F',
    richColor: '#C59A38',
    deepColor: '#8E691D',
    aromaNote: 'หอมกล้วยไม้ป่า หวานติดคอยาวนาน',
    description:
      'อู่หลงกึ่งหมักระดับตำนาน น้ำชาสีทองใส กลิ่นดอกกล้วยไม้อันเป็นเอกลักษณ์',
    flavorProfile: {aroma: 5, sweetness: 4, body: 4},
    recommendedToppings: ['osmanthus'],
    leafShape: 'rolled',
    vesselStyle: 'ceramic',
  },

  // === 4. ชาดำ & ชาไทย (Black Tea) ===
  {
    id: 'thai-tea',
    name: 'ชาไทยโบราณ',
    englishName: 'Classic Thai Tea',
    category: 'black',
    categoryLabel: 'ชาดำ',
    unlockLevel: 1,
    origin: 'เชียงราย · ประเทศไทย',
    harvestSeason: 'คั่วบดสูตรดั้งเดิม',
    caffeineLevel: 'เข้ม',
    idealTemp: 'boiling',
    idealTempLabel: '95°C',
    idealSteepMin: 4.0,
    idealSteepMax: 7.0,
    lightColor: '#DF8B4D',
    richColor: '#C55B24',
    deepColor: '#923B13',
    milkColor: '#D98648',
    aromaNote: 'เข้มข้น หอมกลิ่นเครื่องเทศวานิลลา',
    description:
      'ชาแดงสูตรดั้งเดิม สีส้มอิฐชัดเจน เมื่อเติมนมสดและน้ำแข็งจะนุ่มนวลชวนคิดถึง',
    flavorProfile: {aroma: 4, sweetness: 3, body: 5},
    recommendedToppings: ['milk', 'ice'],
    leafShape: 'broken',
    vesselStyle: 'glass',
  },
  {
    id: 'earl-grey',
    name: 'เอิร์ลเกรย์',
    englishName: 'Earl Grey Bergamot',
    category: 'black',
    categoryLabel: 'ชาดำ',
    unlockLevel: 2,
    origin: 'ซีลอน & เบอร์กาม็อต',
    harvestSeason: 'ตลอดปี',
    caffeineLevel: 'เข้ม',
    idealTemp: 'boiling',
    idealTempLabel: '95°C',
    idealSteepMin: 3.5,
    idealSteepMax: 6.5,
    lightColor: '#CE7E56',
    richColor: '#9C4629',
    deepColor: '#6D2C18',
    milkColor: '#C99E7D',
    aromaNote: 'หอมส้มเบอร์กาม็อต คลาสสิก',
    description:
      'ชาดำผสมน้ำมันผิวส้มเบอร์กาม็อต หอมโปร่งโล่งจมูกในวันฝนพรำ',
    flavorProfile: {aroma: 5, sweetness: 2, body: 4},
    recommendedToppings: ['lemon', 'milk'],
    leafShape: 'broken',
    vesselStyle: 'ceramic',
  },
  {
    id: 'darjeeling-black',
    name: 'ดาร์จีลิงฟลัชแรก',
    englishName: 'First Flush Darjeeling',
    category: 'black',
    categoryLabel: 'ชาดำ',
    unlockLevel: 4,
    origin: 'เทือกเขาหิมาลัย · อินเดีย',
    harvestSeason: 'ยอดอ่อนต้นฤดู',
    caffeineLevel: 'ปานกลาง',
    idealTemp: 'hot',
    idealTempLabel: '85°C',
    idealSteepMin: 3.5,
    idealSteepMax: 6.0,
    lightColor: '#DFB67E',
    richColor: '#BE7A3E',
    deepColor: '#8D5020',
    aromaNote: 'หอมผลไม้อ่อน คล้ายองุ่นมัสแคท',
    description:
      'แชมเปญแห่งชาดำ น้ำสีทองอำพันสว่าง รสเบาโปร่งสบายกว่าชาดำทั่วไป',
    flavorProfile: {aroma: 5, sweetness: 4, body: 3},
    recommendedToppings: ['honey', 'lemon'],
    leafShape: 'broken',
    vesselStyle: 'ceramic',
  },

  // === 5. ชาสมุนไพร & ดอกไม้ (Herbal & Floral) ===
  {
    id: 'chamomile-blossom',
    name: 'คาโมมายล์',
    englishName: 'Chamomile Blossom',
    category: 'herbal',
    categoryLabel: 'ชาสมุนไพร',
    unlockLevel: 1,
    origin: 'สวนดอกไม้บนดอย',
    harvestSeason: 'เก็บเกี่ยวยามเช้า',
    caffeineLevel: 'ไม่มี',
    idealTemp: 'hot',
    idealTempLabel: '85°C',
    idealSteepMin: 3.5,
    idealSteepMax: 6.5,
    lightColor: '#F2E3A4',
    richColor: '#E5C35A',
    deepColor: '#C99F34',
    aromaNote: 'อ่อนโยน คล้ายกลิ่นแอปเปิล',
    description:
      'ดอกคาโมมายล์อบแห้งไร้คาเฟอีน ช่วยคลายความเหนื่อยล้าเบาๆ',
    flavorProfile: {aroma: 4, sweetness: 4, body: 2},
    recommendedToppings: ['honey'],
    leafShape: 'blossom',
    vesselStyle: 'glass',
  },
  {
    id: 'butterfly-pea',
    name: 'อัญชันมินต์',
    englishName: 'Butterfly Pea Mint',
    category: 'herbal',
    categoryLabel: 'ชาสมุนไพร',
    unlockLevel: 3,
    origin: 'ลำปาง · ประเทศไทย',
    harvestSeason: 'ดอกอัญชันสดตากแห้ง',
    caffeineLevel: 'ไม่มี',
    idealTemp: 'hot',
    idealTempLabel: '85°C',
    idealSteepMin: 3.0,
    idealSteepMax: 6.0,
    lightColor: '#86A5D4',
    richColor: '#486BA6',
    deepColor: '#2E497A',
    lemonColor: '#8D529C',
    aromaNote: 'เย็นซ่าเบาๆ เปลี่ยนสีได้ด้วยเลมอน',
    description:
      'กลีบดอกอัญชันสีครามผสานใบมินต์ ลองฝานเลมอนใส่ดูสิ น้ำชาจะเปลี่ยนเป็นสีม่วงละมุน',
    flavorProfile: {aroma: 4, sweetness: 3, body: 2},
    recommendedToppings: ['lemon', 'ice'],
    leafShape: 'blossom',
    vesselStyle: 'glass',
  },
];

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function mixHex(a: string, b: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const r = Math.round(r1 + (r2 - r1) * clamped);
  const g = Math.round(g1 + (g2 - g1) * clamped);
  const bl = Math.round(b1 + (b2 - b1) * clamped);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export function getLiquidColor(
  tea: TeaType,
  steepSeconds: number,
  toppings: ToppingId[],
): string {
  const norm = Math.min(1, steepSeconds / 8);
  let base: string;
  if (norm < 0.2) {
    base = mixHex('#E8E6DF', tea.lightColor, norm / 0.2);
  } else if (norm < 0.65) {
    base = mixHex(tea.lightColor, tea.richColor, (norm - 0.2) / 0.45);
  } else {
    base = mixHex(tea.richColor, tea.deepColor, (norm - 0.65) / 0.35);
  }

  if (toppings.includes('lemon') && tea.lemonColor) {
    base = mixHex(base, tea.lemonColor, 0.85);
  }

  if (toppings.includes('milk')) {
    const targetMilk = tea.milkColor ?? mixHex(base, '#F4EDE1', 0.45);
    base = mixHex(base, targetMilk, 0.75);
  }

  if (toppings.includes('ice')) {
    base = mixHex(base, '#FFFFFF', 0.08);
  }

  return base;
}

export function getStrengthLabel(
  tea: TeaType,
  steepSeconds: number,
): 'อ่อนละมุน' | 'กลมกล่อมลงตัว' | 'เข้มข้นถึงใจ' {
  if (steepSeconds < tea.idealSteepMin) return 'อ่อนละมุน';
  if (steepSeconds <= tea.idealSteepMax) return 'กลมกล่อมลงตัว';
  return 'เข้มข้นถึงใจ';
}
