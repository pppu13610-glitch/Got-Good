import {GuestCharacter, GuestOrder} from '../types/tea';
import {getUnlockedTeas} from './progression';

export const GUESTS: GuestCharacter[] = [
  {
    id: 'som-o',
    name: 'คุณส้มโอ',
    role: 'ลูกค้าประจำมุมหน้าต่าง',
    portraitUrl: '/src/assets/images/guest_somo_human_1795781410921.jpg',
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
  {
    id: 'non',
    name: 'คุณนนท์',
    role: 'สถาปนิกอิสระ',
    portraitUrl: '/src/assets/images/guest_non_architect_1795859226814.jpg',
    fallbackInitial: 'น',
    accentBg: '#DDE0E3',
  },
  {
    id: 'milin',
    name: 'น้องมิลิน',
    role: 'นักศึกษาศิลปะ',
    portraitUrl: '/src/assets/images/guest_milin_student_1795859228444.jpg',
    fallbackInitial: 'ล',
    accentBg: '#DAE4D8',
  },
  {
    id: 'somchai',
    name: 'คุณปู่สมชาย',
    role: 'ช่างไม้เกษียณอารมณ์ดี',
    portraitUrl: '/src/assets/images/guest_somchai_grandpa_1795859229126.jpg',
    fallbackInitial: 'ช',
    accentBg: '#EBDCCB',
  },
  {
    id: 'kiryu',
    name: 'คุณคิริว',
    role: 'นักดนตรีแจ๊ส',
    portraitUrl: '/src/assets/images/guest_kiryu_musician_1795859230534.jpg',
    fallbackInitial: 'ค',
    accentBg: '#E5D6D8',
  },
  {
    id: 'ploysai',
    name: 'คุณพลอยใส',
    role: 'เจ้าของร้านดอกไม้ข้างบ้าน',
    portraitUrl: '/src/assets/images/guest_ploysai_florist_1795859230160.jpg',
    fallbackInitial: 'พ',
    accentBg: '#EBDDD9',
  },
  {
    id: 'pheem',
    name: 'คุณหมอภีม',
    role: 'สัตวแพทย์ใจดี',
    portraitUrl: '/src/assets/images/guest_pheem_vet_1795859252991.jpg',
    fallbackInitial: 'ภ',
    accentBg: '#D8E1EA',
  },
  {
    id: 'meilin',
    name: 'คุณเหมยหลิน',
    role: 'เชฟขนมหวานญี่ปุ่น',
    portraitUrl: '/src/assets/images/guest_meilin_pastry_1795859253412.jpg',
    fallbackInitial: 'ห',
    accentBg: '#EAE0D2',
  },
  {
    id: 'win',
    name: 'คุณวินทร์',
    role: 'ช่างภาพสารคดี',
    portraitUrl: '/src/assets/images/guest_win_photographer_1795859254147.jpg',
    fallbackInitial: 'ว',
    accentBg: '#DCE2D5',
  },
  {
    id: 'chandra',
    name: 'คุณป้าจันทรา',
    role: 'ครูสอนดนตรีไทย',
    portraitUrl: '/src/assets/images/guest_chandra_music_1795859254499.jpg',
    fallbackInitial: 'จ',
    accentBg: '#E6D9E1',
  },
  {
    id: 'tea-master',
    name: 'อาจารย์ชงชาดั้งเดิม',
    role: 'ปรมาจารย์แห่งศาสตร์ชงชา',
    portraitUrl: '/src/assets/images/guest_teamaster_classic_1795860705619.jpg',
    fallbackInitial: 'อ',
    accentBg: '#D4DFD1',
  },
  {
    id: 'spirit-blossom-kindred',
    name: 'คุณคินเดร็ด',
    role: 'จิตวิญญาณบุปผาซากุระ',
    portraitUrl: '/src/assets/images/guest_kindred_spirit_1795860705820.jpg',
    fallbackInitial: 'ค',
    accentBg: '#EAD9EC',
  },
  {
    id: 'mococo-abyssgard',
    name: 'คุณโมโคโค',
    role: 'สาวน้อยสายหวานผู้ร่าเริง',
    portraitUrl: '/src/assets/images/guest_mococo_girl_1795860705637.jpg',
    fallbackInitial: 'ม',
    accentBg: '#F2DCE4',
  },
  {
    id: 'diego-body',
    name: 'คุณดิเอโก้',
    role: 'สุภาพบุรุษสายเนี๊ยบ',
    portraitUrl: '/src/assets/images/guest_diego_dapper_1795860706465.jpg',
    fallbackInitial: 'ด',
    accentBg: '#DADDE2',
  },
  {
    id: 'cicada-suit-v2',
    name: 'คุณซิคาด้า',
    role: 'บอดี้การ์ดชุดเทรนช์',
    portraitUrl: '/src/assets/images/guest_cicada_agent_1795860705872.jpg',
    fallbackInitial: 'ซ',
    accentBg: '#DCD7E3',
  },
];

interface OrderTemplate {
  guestId: string;
  minLevel: number;
  requestTemplate: string;
  preferredCategories?: GuestOrder['preferredCategories'];
  preferredTeaIds?: string[];
  preferredTemp?: 'hot' | 'iced';
  preferredToppings?: GuestOrder['preferredToppings'];
  happyReply: string;
  gentleReply: string;
}

const NATURALLY_ICED_TEA_IDS = new Set([
  'iced-matcha-latte',
  'uji-shizuku-ice',
]);

const NATURALLY_HOT_TEA_IDS = new Set(['matcha-rosetta-latte']);

const ORDER_TEMPLATES: OrderTemplate[] = [
  // คุณส้มโอ
  {
    guestId: 'som-o',
    minLevel: 1,
    requestTemplate:
      'สวัสดีค่ะ วันนี้เห็นบนป้ายเมนูมี「{tea}」เลยขอสั่งแก้วนี้แบบร้อนใส่นมนะคะ',
    preferredCategories: ['matcha', 'green'],
    preferredTemp: 'hot',
    preferredToppings: ['milk'],
    happyReply: 'อุ่นละมุนชื่นใจจังเลยค่ะ ขอบคุณสำหรับแก้วนี้นะคะ~',
    gentleReply: 'รสชาติแปลกใหม่ดีจัง ดื่มแล้วอุ่นใจมากเลยค่ะ',
  },
  {
    guestId: 'som-o',
    minLevel: 1,
    requestTemplate:
      'บ่ายนี้แดดอุ่นจัง เห็นในเมนูมี「{tea}」ขอสั่งแบบใส่น้ำผึ้งหอมๆ สักถ้วยค่ะ',
    preferredCategories: ['herbal'],
    preferredToppings: ['honey'],
    happyReply: 'หอมน้ำผึ้งจังเลย ฟังเสียงลมแล้วง่วงนอนแล้วสิ...',
    gentleReply: 'ถึงจะไม่เหมือนที่คิดไว้ แต่ดื่มแล้วก็สบายใจจังเลย',
  },
  {
    guestId: 'som-o',
    minLevel: 1,
    requestTemplate:
      'บ่ายนี้อากาศอุ่นจังเลยค่ะ ขอสั่ง「{tea}」เติมน้ำแข็งเย็นๆ สักแก้วนะคะ',
    preferredTeaIds: [
      'iced-matcha-latte',
      'classic-matcha',
      'strawberry-matcha-latte',
    ],
    preferredTemp: 'iced',
    preferredToppings: ['milk', 'ice'],
    happyReply: 'เย็นชื่นใจหอมนมสดเลยค่ะ ขอบคุณนะคะ~',
    gentleReply: 'รสชาตินุ่มนวลดีจัง ดื่มแล้วสดชื่นเลยค่ะ',
  },

  // คุณเอลาร่า
  {
    guestId: 'elara',
    minLevel: 1,
    requestTemplate:
      'กำลังเขียนบทใหม่พอดี ขอสั่ง「{tea}」อุ่นๆ จากเมนูร้านมาจิบให้หัวแล่นสักแก้วนะคะ',
    preferredCategories: ['oolong', 'black'],
    preferredTemp: 'hot',
    happyReply: 'กลิ่นหอมกำลังดีเลยค่ะ นึกไอเดียออกอีกหลายหน้าเลย ขอบคุณนะคะ',
    gentleReply: 'ละมุนมากค่ะ จิบไปเขียนบันทึกไปได้เรื่อยๆ เลย',
  },
  {
    guestId: 'elara',
    minLevel: 2,
    requestTemplate:
      'เห็นบนป้ายเมนูร้านมี「{tea}」น่าลองมากเลยค่ะ ขอสั่งถ้วยนี้สักแก้วนะคะ',
    preferredTeaIds: ['uji-roasted-matcha', 'osmanthus-oolong', 'sakura-matcha'],
    preferredToppings: ['osmanthus', 'honey', 'milk'],
    happyReply: 'กลิ่นหอมนุ่มนวลมากเลยค่ะ เหมือนได้พักสายตาจริงๆ',
    gentleReply: 'รสชาติละมุนดีค่ะ ขอบคุณที่ตั้งใจชงให้นะคะ',
  },
  {
    guestId: 'elara',
    minLevel: 3,
    requestTemplate:
      'บ่ายนี้อยากจิบ「{tea}」ใส่น้ำแข็งเย็นชื่นใจสักแก้วค่ะ ดูจากเมนูแล้วน่าดื่มมาก',
    preferredTeaIds: ['butterfly-pea', 'earl-grey', 'gyokuro-green'],
    preferredTemp: 'iced',
    preferredToppings: ['ice', 'lemon'],
    happyReply: 'สีสวยสดชื่นมากเลยค่ะ มองแสงแดดผ่านแก้วแล้วใจฟูขึ้นเยอะเลย',
    gentleReply: 'สดชื่นสบายใจดีค่ะ ขอบคุณที่ตั้งใจชงให้นะคะ',
  },

  // คุณยายมาลี
  {
    guestId: 'malee',
    minLevel: 1,
    requestTemplate:
      'บ่ายๆ แบบนี้ ยายดูป้ายเมนูแล้วขอสั่ง「{tea}」สักแก้วนะจ๊ะหลาน',
    preferredTeaIds: ['thai-tea', 'dongding-oolong', 'osmanthus-oolong'],
    happyReply: 'โอ้โห หอมถูกใจยายเลย ชงได้ละมุนมือมากจ้ะหลาน',
    gentleReply: 'ดื่มแล้วชื่นใจจังเลย ขอบใจนะจ๊ะที่ชงให้ยาย',
  },
  {
    guestId: 'malee',
    minLevel: 2,
    requestTemplate:
      'ช่วงบ่ายแก่ๆ แบบนี้ ยายขอสั่ง「{tea}」อุ่นๆ ที่หน้าร้านมีให้ชงสักถ้วยนะจ๊ะ',
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
    requestTemplate:
      'ช่วงเย็นๆ แบบนี้ ยายอยากจิบ「{tea}」อุ่นๆ สักถ้วยนะจ๊ะหลาน',
    preferredTeaIds: ['hojicha-green', 'darjeeling-black', 'tieguanyin-oolong'],
    preferredTemp: 'hot',
    happyReply: 'หอมกลิ่นคั่วอ่อนๆ ใจสงบดีเหลือเกินจ้ะ',
    gentleReply: 'ได้จิบชาเงียบๆ ในร้านนี้ ยายก็มีความสุขแล้วจ้ะ',
  },

  // คุณนนท์ (สถาปนิกอิสระ)
  {
    guestId: 'non',
    minLevel: 1,
    requestTemplate:
      'เพิ่งตรวจแบบแปลนเสร็จ ขอสั่ง「{tea}」ร้อนจากเมนูมาดื่มแก้ล้าสักแก้วครับ',
    preferredTeaIds: ['kyoto-matcha', 'spring-sencha', 'uji-matcha'],
    preferredTemp: 'hot',
    happyReply: 'รสชัดสมดุลมากครับ เหมือนเส้นสายสถาปัตย์ที่ลงตัวเลย ขอบคุณครับ',
    gentleReply: 'ดื่มง่ายสบายดีครับ มีแรงกลับไปวาดแบบต่อแล้ว',
  },
  {
    guestId: 'non',
    minLevel: 2,
    requestTemplate:
      'ขอสั่ง「{tea}」ร้อนๆ สักแก้วครับ จะเอามานั่งสเก็ตช์งานมุมเงียบๆ หน่อย',
    preferredTeaIds: ['dongding-oolong', 'earl-grey', 'darjeeling-black'],
    preferredTemp: 'hot',
    happyReply: 'กลิ่นหอมสงบมากครับ ช่วยให้โฟกัสงานได้ดีขึ้นเยอะเลย',
    gentleReply: 'อุ่นพอดีเลยครับ ขอบคุณสำหรับชาดีๆ นะครับ',
  },

  // น้องมิลิน (นักศึกษาศิลปะ)
  {
    guestId: 'milin',
    minLevel: 1,
    requestTemplate:
      'หนูเพิ่งส่งงานโปรเจกต์เสร็จ ดูเมนูแล้วขอสั่ง「{tea}」เย็นชื่นใจแก้วนี้เลยค่ะ!',
    preferredTeaIds: [
      'iced-matcha-latte',
      'strawberry-matcha-latte',
      'brown-sugar-matcha-latte',
    ],
    preferredTemp: 'iced',
    preferredToppings: ['milk', 'ice'],
    happyReply: 'เย้! อร่อยสดชื่นมากเลยค่ะ สีแก้วสวยน่าถ่ายรูปสุดๆ~',
    gentleReply: 'นุ่มละมุนดีจังค่ะ ดื่มแล้วหายเหนื่อยเลย!',
  },
  {
    guestId: 'milin',
    minLevel: 2,
    requestTemplate:
      'อยากลองสั่ง「{tea}」สีสวยๆ ถ่ายรูปส่งเพื่อนหน่อยค่า แก้วนี้เลยนะคะ!',
    preferredTeaIds: ['strawberry-matcha-latte', 'butterfly-pea', 'iced-matcha-latte'],
    preferredTemp: 'iced',
    preferredToppings: ['ice', 'strawberry', 'lemon'],
    happyReply: 'ว้าว สีสันสวยละมุนตาเลยค่ะ รสชาติก็โดนใจมาก!',
    gentleReply: 'สดชื่นดีมากเลยค่ะ ขอบคุณพี่เจ้าของร้านนะคะ~',
  },

  // คุณปู่สมชาย (ช่างไม้เกษียณ)
  {
    guestId: 'somchai',
    minLevel: 1,
    requestTemplate:
      'เดินเล่นรับลมมาแวะพักเหนื่อย ขอสั่ง「{tea}」ร้อนชุ่มคอสักแก้วนะหลานชาย',
    preferredTeaIds: ['dongding-oolong', 'thai-tea', 'spring-sencha'],
    preferredTemp: 'hot',
    happyReply: 'ฮ่าๆ หอมเข้มถึงใจปู่เลย ชงได้ฝีมือจริงๆ พ่อหนุ่ม',
    gentleReply: 'รสชาติดีไม่เบาเลยนะ ขอบใจมากนะหลาน',
  },
  {
    guestId: 'somchai',
    minLevel: 4,
    requestTemplate:
      'ช่วงบ่ายแบบนี้ ปู่ขอสั่ง「{tea}」รสกลมกล่อมจากเมนูสักถ้วยนะจ๊ะ',
    preferredTeaIds: ['hojicha-green', 'classic-heritage-matcha', 'tieguanyin-oolong'],
    preferredTemp: 'hot',
    happyReply: 'กลิ่นหอมไม้คั่วอบอุ่นเหมือนอยู่ในโรงไม้สมัยหนุ่มๆ เลยแฮะ',
    gentleReply: 'ดื่มแล้วอบอุ่นหัวใจดีจังเลยนะร้านนี้',
  },

  // คุณคิริว (นักดนตรีแจ๊ส)
  {
    guestId: 'kiryu',
    minLevel: 1,
    requestTemplate:
      'ก่อนขึ้นซ้อมดนตรีคืนนี้ ขอสั่ง「{tea}」อุ่นๆ ให้เสียงนุ่มสักแก้วครับ',
    preferredCategories: ['black', 'matcha'],
    preferredTemp: 'hot',
    happyReply: 'รสลุ่มลึกเหมือนคอร์ดแจ๊สเลยครับ โดนใจมาก!',
    gentleReply: 'ฟีลกู้ดดีเลยครับ ขอบคุณมากครับผม',
  },
  {
    guestId: 'kiryu',
    minLevel: 2,
    requestTemplate:
      'เห็นในป้ายเมนูมี「{tea}」พอดี วันนี้ขอสั่งแก้วนี้เลยครับ',
    preferredTeaIds: [
      'uji-roasted-matcha',
      'brown-sugar-cloud-latte',
      'brown-sugar-matcha-latte',
    ],
    preferredToppings: ['milk', 'brown-sugar', 'milk-foam'],
    happyReply: 'กลิ่นคั่วกับคาราเมลเข้าจังหวะกันเป๊ะเลยครับ สุดยอด!',
    gentleReply: 'นุ่มนวลลงตัวมากครับ ไว้แวะมาฟังเพลงด้วยกันนะครับ',
  },

  // คุณพลอยใส (เจ้าของร้านดอกไม้)
  {
    guestId: 'ploysai',
    minLevel: 1,
    requestTemplate:
      'จัดช่อดอกไม้เสร็จแวะมาพักค่ะ ขอสั่ง「{tea}」อุ่นๆ ใส่น้ำผึ้งสักถ้วยนะคะ',
    preferredTeaIds: ['chamomile-blossom', 'osmanthus-oolong', 'dongding-oolong'],
    preferredTemp: 'hot',
    preferredToppings: ['honey', 'osmanthus'],
    happyReply: 'หอมกลิ่นดอกไม้ละมุนมากค่ะ เหมือนยกสวนมาไว้ในถ้วยเลย~',
    gentleReply: 'นุ่มนวลชวนผ่อนคลายมากค่ะ ขอบคุณนะคะ',
  },
  {
    guestId: 'ploysai',
    minLevel: 3,
    requestTemplate:
      'อยากลอง「{tea}」ที่อยู่บนป้ายเมนูร้านค่ะ ขอสั่งแก้วนี้สักถ้วยนะคะ',
    preferredTeaIds: ['sakura-matcha', 'osmanthus-oolong', 'chamomile-blossom'],
    preferredToppings: ['osmanthus', 'milk'],
    happyReply: 'กลิ่นดอกไม้ฟุ้งละมุนหัวใจเลยค่ะ ประทับใจมากเลย',
    gentleReply: 'หอมหวานกำลังดีเลยค่ะ ขอบคุณที่ชงให้ด้วยใจนะคะ',
  },

  // คุณหมอภีม (สัตวแพทย์ใจดี)
  {
    guestId: 'pheem',
    minLevel: 1,
    requestTemplate:
      'พักเบรกจากคลินิกครับ ขอสั่ง「{tea}」สดชื่นสบายท้องสักถ้วยครับ',
    preferredTeaIds: ['spring-sencha', 'kyoto-matcha', 'gyokuro-green'],
    preferredTemp: 'hot',
    happyReply: 'สะอาดสดชื่นมากครับ รู้สึกผ่อนคลายขึ้นเยอะเลย',
    gentleReply: 'ดื่มง่ายกำลังดีเลยครับ ขอบคุณมากนะครับ',
  },
  {
    guestId: 'pheem',
    minLevel: 3,
    requestTemplate:
      'วันนี้แดดค่อนข้างแรง ขอสั่ง「{tea}」เย็นๆ เติมใบมินต์สดชื่นสักแก้วครับ',
    preferredTeaIds: ['uji-shizuku-ice', 'gyokuro-green', 'spring-sencha'],
    preferredTemp: 'iced',
    preferredToppings: ['ice', 'mint'],
    happyReply: 'เย็นฉ่ำหวานอูมามิจากยอดชาแท้ๆ เลยครับ ดีมากจริงๆ',
    gentleReply: 'สดชื่นหายเหนื่อยเลยครับ ไว้แวะมาใหม่นะครับ',
  },

  // คุณเหมยหลิน (เชฟขนมหวาน)
  {
    guestId: 'meilin',
    minLevel: 1,
    requestTemplate:
      'ดูป้ายเมนูแล้วขอสั่ง「{tea}」สักแก้วค่ะ อยากชิมเป็นแรงบันดาลใจทำขนมวากาชิ',
    preferredCategories: ['matcha', 'latte'],
    preferredToppings: ['milk', 'milk-foam'],
    happyReply: 'เนื้อฟองเนียนละเอียดไร้ที่ติเลยค่ะ หวานกำลังดีมาก!',
    gentleReply: 'บาลานซ์รสชาติดีมากค่ะ ได้ไอเดียทำขนมคู่ชาแล้ว!',
  },
  {
    guestId: 'meilin',
    minLevel: 3,
    requestTemplate:
      'วันนี้ขอสั่ง「{tea}」อุ่นๆ คู่ขนมหวานสักแก้วนะคะ',
    preferredTeaIds: [
      'matcha-rosetta-latte',
      'pumpkin-spice-matcha',
      'kintsugi-matcha',
    ],
    preferredTemp: 'hot',
    preferredToppings: ['milk-foam', 'cinnamon'],
    happyReply: 'ลวดลายและกลิ่นหอมละมุนระดับมาสเตอร์เลยค่ะ ชอบมากเลย!',
    gentleReply: 'อุ่นหอมเข้ากับขนมหวานมากเลยค่ะ ขอบคุณนะคะ',
  },

  // คุณวินทร์ (ช่างภาพสารคดี)
  {
    guestId: 'win',
    minLevel: 1,
    requestTemplate:
      'เพิ่งกลับจากถ่ายภาพนอกสถานที่ ขอสั่ง「{tea}」ใส่น้ำแข็งเย็นจัดสักแก้วครับ!',
    preferredTeaIds: ['thai-tea', 'iced-matcha-latte', 'uji-shizuku-ice'],
    preferredTemp: 'iced',
    preferredToppings: ['ice', 'milk'],
    happyReply: 'ชื่นใจสุดๆ ไปเลยครับ! เข้มข้นสะใจหายร้อนเลย',
    gentleReply: 'เย็นกำลังดีเลยครับ มีพลังลุยถ่ายรูปต่อแล้ว!',
  },
  {
    guestId: 'win',
    minLevel: 2,
    requestTemplate:
      'ช่วงเย็นแสงสวยแบบนี้ ขอสั่ง「{tea}」เย็นฝานเลมอนไว้นั่งคัดรูปสักแก้วครับ',
    preferredTeaIds: ['earl-grey', 'butterfly-pea', 'thai-tea'],
    preferredTemp: 'iced',
    preferredToppings: ['ice', 'lemon'],
    happyReply: 'สดชื่นเปรี้ยวหอมตื่นตาดีมากครับ สีแก้วสวยจนต้องยกกล้องถ่ายเลย',
    gentleReply: 'ดื่มเพลินมากครับ ขอบคุณเจ้าของร้านมากครับ',
  },

  // คุณป้าจันทรา (ครูสอนดนตรีไทย)
  {
    guestId: 'chandra',
    minLevel: 1,
    requestTemplate:
      'สอนดนตรีเสร็จแวะมาชุ่มคอค่ะ ดูเมนูแล้วขอสั่ง「{tea}」อุ่นๆ สักถ้วยนะคะ',
    preferredCategories: ['oolong', 'herbal'],
    preferredTemp: 'hot',
    happyReply: 'หอมละมุนชุ่มคอไพเราะเหมือนเสียงขิมเลยค่ะ ฝีมือดีจริงเชียว',
    gentleReply: 'ชุ่มคอสบายใจมากเลยค่ะ ขอบคุณมากนะจ๊ะ',
  },
  {
    guestId: 'chandra',
    minLevel: 2,
    requestTemplate:
      'วันนี้ป้าขอสั่ง「{tea}」ร้อนๆ ที่กลิ่นหอมประณีตสักถ้วยนะคะ',
    preferredTeaIds: ['osmanthus-oolong', 'tieguanyin-oolong', 'darjeeling-black'],
    preferredTemp: 'hot',
    preferredToppings: ['osmanthus'],
    happyReply: 'กลิ่นหอมสง่างามมากเลยค่ะ จิบแล้วจิตใจสงบงดงามจริงๆ',
    gentleReply: 'รสชาตินุ่มนวลดีมากค่ะ ป้าชอบร้านนี้มากเลย',
  },

  // อาจารย์ชงชาดั้งเดิม (Returning Tea Master)
  {
    guestId: 'tea-master',
    minLevel: 1,
    requestTemplate:
      'แวะมาเยี่ยมเยียนเรือนชา ขอสั่ง「{tea}」รสบริสุทธิ์สักถ้วยครับ',
    preferredCategories: ['matcha', 'green'],
    preferredTemp: 'hot',
    happyReply: 'สมดุลอุณหภูมิและฟองชาได้ประณีตมาก น่าภูมิใจจริงๆ ครับ',
    gentleReply: 'ตั้งใจชงได้ดีทีเดียว ฝึกฝนต่อไปจะยิ่งละมุนขึ้นอีกครับ',
  },
  {
    guestId: 'tea-master',
    minLevel: 2,
    requestTemplate:
      'วันนี้อยากลิ้มลอง「{tea}」ที่พร้อมชงบนป้ายเมนูสักถ้วยครับ',
    preferredTeaIds: [
      'ceremonial-matcha',
      'uji-matcha',
      'kintsugi-matcha',
      'classic-heritage-matcha',
    ],
    preferredTemp: 'hot',
    happyReply: 'กลิ่นอูมามิและเนื้อชาเนียนละเอียดระดับตำรับแท้เลยครับ ยอดเยี่ยมมาก',
    gentleReply: 'ถ้วยนี้อบอุ่นและเปี่ยมความตั้งใจดีมากครับ ขอบคุณนะ',
  },

  // คุณคินเดร็ด (Spirit Blossom Kindred)
  {
    guestId: 'spirit-blossom-kindred',
    minLevel: 1,
    requestTemplate:
      'สายลมพัดกลีบดอกไม้มาทางนี้... ขอสั่ง「{tea}」อุ่นใจสักถ้วยนะคะ',
    preferredCategories: ['herbal', 'oolong'],
    preferredTemp: 'hot',
    preferredToppings: ['honey', 'osmanthus'],
    happyReply: 'กลิ่นหอมสงบราวกับสวนวิญญาณยามค่ำคืนเลยค่ะ... ขอบคุณนะคะ',
    gentleReply: 'ชานี้อบอุ่นละมุนใจดีจังเลยค่ะ~',
  },
  {
    guestId: 'spirit-blossom-kindred',
    minLevel: 3,
    requestTemplate:
      'ขอเลือก「{tea}」จากป้ายเมนูร้านสักถ้วยนะคะ กลิ่นคงหอมเหมือนกลีบบุปผาเลย',
    preferredTeaIds: ['sakura-matcha', 'osmanthus-oolong', 'chamomile-blossom'],
    preferredToppings: ['osmanthus', 'milk'],
    happyReply: 'วิญญาณหมาป่ายังชอบกลิ่นหอมนี้เลยค่ะ นุ่มนวลบริสุทธิ์มากจริงๆ',
    gentleReply: 'รสชาติอ่อนโยนชวนฝันดีมากเลยค่ะ ไว้แวะมาอีกนะคะ',
  },

  // คุณโมโคโค (Mococo Abyssgard)
  {
    guestId: 'mococo-abyssgard',
    minLevel: 1,
    requestTemplate:
      'เบาเบา~! วันนี้หนูดูเมนูแล้ว ขอสั่ง「{tea}」เย็นหวานชื่นใจแก้วนี้เลย!',
    preferredTeaIds: [
      'strawberry-matcha-latte',
      'iced-matcha-latte',
      'brown-sugar-matcha-latte',
    ],
    preferredTemp: 'iced',
    preferredToppings: ['milk', 'ice', 'strawberry'],
    happyReply: 'เย้~! หวานหอมฟินสุดๆ เลยล่ะ! ชงเก่งมากเลยนะ~!',
    gentleReply: 'อร่อยสดชื่นมากเลย! มีแรงวิ่งเล่นต่อทั้งวันแล้ว!',
  },
  {
    guestId: 'mococo-abyssgard',
    minLevel: 2,
    requestTemplate:
      'ขอสั่ง「{tea}」ฟองนมนุ่มฟูๆ จากเมนูสักแก้วได้ไหมเอ่ย~',
    preferredTeaIds: [
      'brown-sugar-cloud-latte',
      'matcha-rosetta-latte',
      'iced-matcha-latte',
    ],
    preferredToppings: ['milk-foam', 'brown-sugar', 'milk'],
    happyReply: 'ฟองนมนุ่มฟูเหมือนหางหมาป่าเลย~! ชอบที่สุดเลยค่ะ!',
    gentleReply: 'หอมหวานอร่อยจัง ขอบคุณมากเลยนะ~!',
  },

  // คุณดิเอโก้ (Diego / Body)
  {
    guestId: 'diego-body',
    minLevel: 1,
    requestTemplate:
      'ผมดูป้ายเมนูแล้ว ขอสั่ง「{tea}」ร้อนๆ รสเข้มเรียบหรูสักแก้วครับ',
    preferredTeaIds: ['earl-grey', 'dongding-oolong', 'darjeeling-black'],
    preferredTemp: 'hot',
    happyReply: 'จังหวะการชงและการคุมกลิ่นแม่นยำมากครับ สมบูรณ์แบบทีเดียว',
    gentleReply: 'รสชาติสะอาดนุ่มลึกดีครับ ขอบคุณสำหรับบริการที่ยอดเยี่ยม',
  },
  {
    guestId: 'diego-body',
    minLevel: 2,
    requestTemplate:
      'บ่ายนี้ขอสั่ง「{tea}」กลิ่นหอมลุ่มลึกสักถ้วยครับ',
    preferredTeaIds: ['kyoto-matcha', 'hojicha-green', 'uji-roasted-matcha'],
    preferredTemp: 'hot',
    happyReply: 'รสขมละมุนและกลิ่นคั่วลึกกำลังพอดีเลยครับ ประทับใจมาก',
    gentleReply: 'เป็นแก้วที่ช่วยให้ผ่อนคลายได้ดีมากครับ',
  },

  // คุณซิคาด้า (Ultimate CICADA Suit V2)
  {
    guestId: 'cicada-suit-v2',
    minLevel: 1,
    requestTemplate:
      'ช่วงพักเวรรักษาความปลอดภัย ขอสั่ง「{tea}」จากเมนูช่วยตื่นตัวสักแก้วครับ',
    preferredTeaIds: ['thai-tea', 'earl-grey', 'darjeeling-black'],
    happyReply: 'เข้มข้นถึงใจและชัดเจนดีมากครับ พร้อมกลับไปปฏิบัติหน้าที่ต่อแล้ว',
    gentleReply: 'รสชาติดีใช้ได้เลยครับ ขอบคุณมากเจ้าของร้าน',
  },
  {
    guestId: 'cicada-suit-v2',
    minLevel: 3,
    requestTemplate:
      'ขอสั่ง「{tea}」ร้อนรสหนักแน่นจากเมนูร้านสักถ้วยครับ',
    preferredTeaIds: ['tieguanyin-oolong', 'uji-roasted-matcha', 'gyokuro-green'],
    preferredTemp: 'hot',
    happyReply: 'หนักแน่นและนิ่งสงบดีมากครับ สมกับเป็นร้านชามืออาชีพ',
    gentleReply: 'ดื่มง่ายและสดชื่นขึ้นเยอะเลยครับ ไว้จะแวะมาใหม่',
  },
];

function getTemplateUnlockedCandidates(
  template: OrderTemplate,
  unlockedTeas: ReturnType<typeof getUnlockedTeas>,
) {
  const unlockedIds = new Set(unlockedTeas.map((t) => t.id));
  let candidates = template.preferredTeaIds
    ? unlockedTeas.filter((t) => template.preferredTeaIds!.includes(t.id))
    : template.preferredCategories
      ? unlockedTeas.filter((t) =>
          template.preferredCategories!.includes(t.category),
        )
      : unlockedTeas;

  // Keep temperature intent coherent (e.g. don't pick iced-only tea for a hot order)
  if (template.preferredTemp === 'hot') {
    const hotCompatible = candidates.filter(
      (t) => !NATURALLY_ICED_TEA_IDS.has(t.id),
    );
    if (hotCompatible.length > 0) candidates = hotCompatible;
  } else if (template.preferredTemp === 'iced') {
    const icedCompatible = candidates.filter(
      (t) => !NATURALLY_HOT_TEA_IDS.has(t.id),
    );
    if (icedCompatible.length > 0) candidates = icedCompatible;
  }

  return candidates.filter((t) => unlockedIds.has(t.id));
}

export function createRandomGuestOrder(
  playerLevel = 1,
  previousGuestId?: string,
): GuestOrder {
  const unlockedTeas = getUnlockedTeas(playerLevel);
  const eligible = ORDER_TEMPLATES.filter((t) => {
    if (t.minLevel > playerLevel) return false;
    return getTemplateUnlockedCandidates(t, unlockedTeas).length > 0;
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

  // Uniformly pick among distinct eligible guests first so all 17 customers appear with equal variety
  const eligibleGuestIds = Array.from(new Set(pool.map((t) => t.guestId)));
  const pickedGuestId =
    eligibleGuestIds[Math.floor(Math.random() * eligibleGuestIds.length)];
  const guestTemplates = pool.filter((t) => t.guestId === pickedGuestId);
  const picked =
    guestTemplates[Math.floor(Math.random() * guestTemplates.length)] ??
    pool[0];

  const guest = GUESTS.find((g) => g.id === picked.guestId) ?? GUESTS[0];

  // Customer selects strictly ONE tea from unlocked teas that appear on the shop menu
  const candidates = getTemplateUnlockedCandidates(picked, unlockedTeas);
  const chosenPool = candidates.length > 0 ? candidates : unlockedTeas;
  const chosenTea =
    chosenPool[Math.floor(Math.random() * chosenPool.length)] ?? unlockedTeas[0];

  const resolvedTemp = NATURALLY_ICED_TEA_IDS.has(chosenTea.id)
    ? 'iced'
    : NATURALLY_HOT_TEA_IDS.has(chosenTea.id)
      ? 'hot'
      : picked.preferredTemp;

  return {
    id: `${picked.guestId}-${chosenTea.id}-${Date.now()}`,
    guest,
    requestText: picked.requestTemplate.replace('{tea}', chosenTea.name),
    preferredTeaIds: [chosenTea.id],
    preferredTemp: resolvedTemp,
    preferredToppings: picked.preferredToppings,
    happyReply: picked.happyReply,
    gentleReply: picked.gentleReply,
  };
}
