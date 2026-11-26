import {GuestCharacter, GuestOrder} from '../types/tea';
import {getUnlockedTeas} from './progression';

export const GUESTS: GuestCharacter[] = [
  {
    id: 'som-o',
    name: 'คุณส้มโอ',
    role: 'แมวส้มประจำมุมหน้าต่าง',
    portraitUrl: '/src/assets/images/guest_cat_1795626509273.jpg',
    fallbackInitial: 'ส',
    accentBg: '#D8E0D4',
  },
  {
    id: 'elara',
    name: 'คุณเอลาร่า',
    role: 'นักเขียนนิยายสายชิล',
    portraitUrl: '/src/assets/images/guest_writer_1795626509986.jpg',
    fallbackInitial: 'อ',
    accentBg: '#E4DFD4',
  },
  {
    id: 'malee',
    name: 'คุณยายมาลี',
    role: 'เพื่อนบ้านผู้รักกลิ่นชาหอม',
    portraitUrl: '/src/assets/images/guest_grandma_1795626510510.jpg',
    fallbackInitial: 'ม',
    accentBg: '#E7E3D8',
  },
];

interface OrderTemplate {
  guestId: string;
  minLevel: number;
  requestText: string;
  preferredCategories?: GuestOrder['preferredCategories'];
  preferredTeaIds?: string[];
  preferredTemp?: 'hot' | 'iced';
  preferredToppings?: GuestOrder['preferredToppings'];
  happyReply: string;
  gentleReply: string;
}

const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    guestId: 'som-o',
    minLevel: 1,
    requestText:
      'เมี๊ยว... วันนี้อยากได้ชามัทฉะหรือชาเขียวนุ่มๆ เติมนมอุ่นสักแก้วนะ',
    preferredCategories: ['matcha', 'green'],
    preferredTemp: 'hot',
    preferredToppings: ['milk'],
    happyReply: 'อุ่นสบายท้องเลย... ขอบคุณสำหรับแก้วนี้นะ เมี๊ยว~',
    gentleReply: 'รสชาติแปลกใหม่ดีจัง แต่ก็อุ่นใจเหมือนกันนะ เมี๊ยว',
  },
  {
    guestId: 'som-o',
    minLevel: 1,
    requestText: 'บ่ายนี้แดดอุ่นจัง ขอคาโมมายล์ใส่น้ำผึ้งหอมๆ สักถ้วยได้ไหม',
    preferredCategories: ['herbal'],
    preferredToppings: ['honey'],
    happyReply: 'หอมน้ำผึ้งจังเลย ฟังเสียงลมแล้วง่วงนอนแล้วสิ...',
    gentleReply: 'ถึงจะไม่เหมือนที่คิดไว้ แต่ดื่มแล้วก็สบายใจจังเลย',
  },
  {
    guestId: 'elara',
    minLevel: 1,
    requestText:
      'กำลังเขียนบทใหม่พอดี ขอชาอู่หลงหอมๆ หรือชาดำอุ่นๆ ช่วยให้หัวแล่นหน่อยนะคะ',
    preferredCategories: ['oolong', 'black'],
    preferredTemp: 'hot',
    happyReply: 'กลิ่นหอมกำลังดีเลยค่ะ นึกไอเดียออกอีกหลายหน้าเลย ขอบคุณนะคะ',
    gentleReply: 'ละมุนมากค่ะ จิบไปเขียนบันทึกไปได้เรื่อยๆ เลย',
  },
  {
    guestId: 'elara',
    minLevel: 2,
    requestText:
      'อยากชิมมัทฉะคั่วหรือชาหอมหมื่นลี้สักถ้วย เติมดอกไม้หรือน้ำผึ้งนิดหน่อยก็เยี่ยมเลยค่ะ',
    preferredTeaIds: ['uji-roasted-matcha', 'osmanthus-oolong', 'sakura-matcha'],
    preferredToppings: ['osmanthus', 'honey', 'milk'],
    happyReply: 'กลิ่นหอมนุ่มนวลมากเลยค่ะ เหมือนได้พักสายตาจริงๆ',
    gentleReply: 'รสชาติละมุนดีค่ะ ขอบคุณที่ตั้งใจชงให้นะคะ',
  },
  {
    guestId: 'elara',
    minLevel: 3,
    requestText:
      'อยากลองชาอัญชันสีสวยๆ ใส่น้ำแข็งเย็นชื่นใจ หรือฝานเลมอนสักหน่อยก็ดีเลยค่ะ',
    preferredTeaIds: ['butterfly-pea', 'earl-grey', 'gyokuro-green'],
    preferredTemp: 'iced',
    preferredToppings: ['ice', 'lemon'],
    happyReply: 'สีสวยสดชื่นมากเลยค่ะ มองแสงแดดผ่านแก้วแล้วใจฟูขึ้นเยอะเลย',
    gentleReply: 'สดชื่นสบายใจดีค่ะ ขอบคุณที่ตั้งใจชงให้นะคะ',
  },
  {
    guestId: 'malee',
    minLevel: 1,
    requestText:
      'บ่ายๆ แบบนี้ ยายคิดถึงชาไทยโบราณใส่นม หรือชาอู่หลงชุ่มคอสักแก้วจ้ะ',
    preferredTeaIds: ['thai-tea', 'dongding-oolong', 'osmanthus-oolong'],
    happyReply: 'โอ้โห หอมถูกใจยายเลย ชงได้ละมุนมือมากจ้ะหลาน',
    gentleReply: 'ดื่มแล้วชื่นใจจังเลย ขอบใจนะจ๊ะที่ชงให้ยาย',
  },
  {
    guestId: 'som-o',
    minLevel: 1,
    requestText:
      'บ่ายนี้อากาศอุ่นจัง เมี๊ยว~ อยากได้มัทฉะลาเต้เย็น หรือ Matcha คลาสสิกใส่น้ำแข็งสักแก้วจัง',
    preferredTeaIds: [
      'iced-matcha-latte',
      'classic-matcha',
      'strawberry-matcha-latte',
    ],
    preferredToppings: ['milk', 'ice'],
    happyReply: 'เย็นชื่นใจหอมนมสดเลย... ขอบคุณนะ เมี๊ยว~',
    gentleReply: 'รสชาตินุ่มนวลดีจัง ดื่มแล้วสดชื่นเลย เมี๊ยว',
  },
  {
    guestId: 'elara',
    minLevel: 3,
    requestText:
      'วันนี้อยากลองชิมมัทฉะฟักทองสไปซ์ หรืออูจิ ชิซึคุ ไอซ์ เป็นแรงบันดาลใจเขียนนิยายสักหน่อยค่ะ',
    preferredTeaIds: [
      'pumpkin-spice-matcha',
      'uji-shizuku-ice',
      'brown-sugar-matcha-latte',
    ],
    preferredToppings: ['milk', 'ice', 'honey'],
    happyReply: 'กลิ่นหอมเป็นเอกลักษณ์มากค่ะ มีไอเดียแต่งเรื่องต่อยาวเลย',
    gentleReply: 'ขอบคุณนะคะ อุ่นใจและสดชื่นดีมากเลยค่ะ',
  },
  {
    guestId: 'malee',
    minLevel: 2,
    requestText:
      'ช่วงบ่ายแก่ๆ แบบนี้ ยายอยากได้มัทฉะตีฟองนุ่มๆ อย่าง Uji Matcha หรือ Matcha สำหรับพิธีกรรมจ้ะ',
    preferredTeaIds: [
      'uji-matcha',
      'ceremonial-matcha',
      'matcha-rosetta-latte',
      'kintsugi-matcha',
    ],
    preferredTemp: 'hot',
    happyReply: 'ฟองนุ่มหอมเข้มถูกใจยายเหลือเกิน ชงเก่งขึ้นเยอะเลยนะหลาน',
    gentleReply: 'ได้จิบมัทฉะหอมๆ แบบนี้ ยายก็ชื่นใจมากแล้วจ้ะ',
  },
  {
    guestId: 'malee',
    minLevel: 4,
    requestText:
      'ช่วงเย็นๆ แบบนี้ ยายอยากได้โฮจิฉะคั่วหอมหรือดาร์จีลิงอุ่นๆ สักถ้วยนะจ๊ะ',
    preferredTeaIds: ['hojicha-green', 'darjeeling-black', 'tieguanyin-oolong'],
    preferredTemp: 'hot',
    happyReply: 'หอมกลิ่นคั่วอ่อนๆ ใจสงบดีเหลือเกินจ้ะ',
    gentleReply: 'ได้จิบชาเงียบๆ ในร้านนี้ ยายก็มีความสุขแล้วจ้ะ',
  },
];

export function createRandomGuestOrder(
  playerLevel = 1,
  previousGuestId?: string,
): GuestOrder {
  const unlockedIds = new Set(getUnlockedTeas(playerLevel).map((t) => t.id));
  const eligible = ORDER_TEMPLATES.filter((t) => {
    if (t.minLevel > playerLevel) return false;
    if (t.preferredTeaIds) {
      return t.preferredTeaIds.some((id) => unlockedIds.has(id));
    }
    return true;
  });

  const nonRepeating = previousGuestId
    ? eligible.filter((t) => t.guestId !== previousGuestId)
    : eligible;
  const pool =
    nonRepeating.length > 0
      ? nonRepeating
      : eligible.length > 0
        ? eligible
        : [ORDER_TEMPLATES[0]];

  const picked = pool[Math.floor(Math.random() * pool.length)];
  const guest = GUESTS.find((g) => g.id === picked.guestId) ?? GUESTS[0];

  return {
    id: `${picked.guestId}-${Date.now()}`,
    guest,
    requestText: picked.requestText,
    preferredCategories: picked.preferredCategories,
    preferredTeaIds: picked.preferredTeaIds,
    preferredTemp: picked.preferredTemp,
    preferredToppings: picked.preferredToppings,
    happyReply: picked.happyReply,
    gentleReply: picked.gentleReply,
  };
}
