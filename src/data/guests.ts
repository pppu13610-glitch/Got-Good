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
  // คุณส้มโอ
  {
    guestId: 'som-o',
    minLevel: 1,
    requestText:
      'สวัสดีค่ะ วันนี้อยากได้ชามัทฉะหรือชาเขียวนุ่มๆ เติมนมอุ่นสักแก้วนะคะ',
    preferredCategories: ['matcha', 'green'],
    preferredTemp: 'hot',
    preferredToppings: ['milk'],
    happyReply: 'อุ่นละมุนชื่นใจจังเลยค่ะ ขอบคุณสำหรับแก้วนี้นะคะ~',
    gentleReply: 'รสชาติแปลกใหม่ดีจัง ดื่มแล้วอุ่นใจมากเลยค่ะ',
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
    guestId: 'som-o',
    minLevel: 1,
    requestText:
      'บ่ายนี้อากาศอุ่นจังเลยค่ะ อยากได้มัทฉะลาเต้เย็น หรือ Matcha คลาสสิกใส่น้ำแข็งสักแก้วจัง',
    preferredTeaIds: [
      'iced-matcha-latte',
      'classic-matcha',
      'strawberry-matcha-latte',
    ],
    preferredToppings: ['milk', 'ice'],
    happyReply: 'เย็นชื่นใจหอมนมสดเลยค่ะ ขอบคุณนะคะ~',
    gentleReply: 'รสชาตินุ่มนวลดีจัง ดื่มแล้วสดชื่นเลยค่ะ',
  },

  // คุณเอลาร่า
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

  // คุณยายมาลี
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

  // คุณนนท์ (สถาปนิกอิสระ)
  {
    guestId: 'non',
    minLevel: 1,
    requestText:
      'เพิ่งตรวจแบบแปลนเสร็จ ขอ Matcha เข้มข้นไม่หวานมาก หรือเซนฉะใสๆ ดื่มแก้ล้าสักแก้วครับ',
    preferredTeaIds: ['kyoto-matcha', 'spring-sencha', 'uji-matcha'],
    preferredTemp: 'hot',
    happyReply: 'รสชัดสมดุลมากครับ เหมือนเส้นสายสถาปัตย์ที่ลงตัวเลย ขอบคุณครับ',
    gentleReply: 'ดื่มง่ายสบายดีครับ มีแรงกลับไปวาดแบบต่อแล้ว',
  },
  {
    guestId: 'non',
    minLevel: 2,
    requestText:
      'อยากได้อู่หลงต้งติ่งหรือเอิร์ลเกรย์ร้อนๆ ไว้นั่งสเก็ตช์งานมุมเงียบๆ สักหน่อยครับ',
    preferredTeaIds: ['dongding-oolong', 'earl-grey', 'darjeeling-black'],
    preferredTemp: 'hot',
    happyReply: 'กลิ่นหอมสงบมากครับ ช่วยให้โฟกัสงานได้ดีขึ้นเยอะเลย',
    gentleReply: 'อุ่นพอดีเลยครับ ขอบคุณสำหรับชาดีๆ นะครับ',
  },

  // น้องมิลิน (นักศึกษาศิลปะ)
  {
    guestId: 'milin',
    minLevel: 1,
    requestText:
      'หนูเพิ่งส่งงานโปรเจกต์เสร็จ อยากได้มัทฉะลาเต้เย็นใส่นมสดหวานชื่นใจสุดๆ เลยค่ะ!',
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
    requestText:
      'อยากลองสตรอเบอร์รี่มัทฉะลาเต้หรืออัญชันมินต์สีสวยๆ ถ่ายรูปส่งเพื่อนหน่อยค่า',
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
    requestText:
      'เดินเล่นรับลมมาแวะพักเหนื่อย ขอชาอู่หลงต้งติ่งหรือชาไทยร้อนชุ่มคอสักแก้วนะหลานชาย',
    preferredTeaIds: ['dongding-oolong', 'thai-tea', 'spring-sencha'],
    preferredTemp: 'hot',
    happyReply: 'ฮ่าๆ หอมเข้มถึงใจปู่เลย ชงได้ฝีมือจริงๆ พ่อหนุ่ม',
    gentleReply: 'รสชาติดีไม่เบาเลยนะ ขอบใจมากนะหลาน',
  },
  {
    guestId: 'somchai',
    minLevel: 4,
    requestText:
      'ช่วงบ่ายแบบนี้ ปู่อยากจิบโฮจิฉะคั่วหอมหรือมรดกคลาสสิกรสกลมกล่อมสักถ้วยจ้ะ',
    preferredTeaIds: ['hojicha-green', 'classic-heritage-matcha', 'tieguanyin-oolong'],
    preferredTemp: 'hot',
    happyReply: 'กลิ่นหอมไม้คั่วอบอุ่นเหมือนอยู่ในโรงไม้สมัยหนุ่มๆ เลยแฮะ',
    gentleReply: 'ดื่มแล้วอบอุ่นหัวใจดีจังเลยนะร้านนี้',
  },

  // คุณคิริว (นักดนตรีแจ๊ส)
  {
    guestId: 'kiryu',
    minLevel: 1,
    requestText:
      'ก่อนขึ้นซ้อมดนตรีคืนนี้ ขอชาดำหรือ Matcha คลาสสิกอุ่นๆ สักแก้วให้เสียงนุ่มหน่อยครับ',
    preferredCategories: ['black', 'matcha'],
    preferredTemp: 'hot',
    happyReply: 'รสลุ่มลึกเหมือนคอร์ดแจ๊สเลยครับ โดนใจมาก!',
    gentleReply: 'ฟีลกู้ดดีเลยครับ ขอบคุณมากครับผม',
  },
  {
    guestId: 'kiryu',
    minLevel: 2,
    requestText:
      'วันนี้อยากได้มัทฉะคั่วอุจิ หรือลาเต้เมฆน้ำตาลทรายแดงหอมคาราเมลเข้มๆ ครับ',
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
    requestText:
      'จัดช่อดอกไม้เสร็จแวะมาพักค่ะ ขอชาคาโมมายล์อุ่นๆ ใส่น้ำผึ้ง หรืออู่หลงหอมๆ นะคะ',
    preferredTeaIds: ['chamomile-blossom', 'osmanthus-oolong', 'dongding-oolong'],
    preferredTemp: 'hot',
    preferredToppings: ['honey', 'osmanthus'],
    happyReply: 'หอมกลิ่นดอกไม้ละมุนมากค่ะ เหมือนยกสวนมาไว้ในถ้วยเลย~',
    gentleReply: 'นุ่มนวลชวนผ่อนคลายมากค่ะ ขอบคุณนะคะ',
  },
  {
    guestId: 'ploysai',
    minLevel: 3,
    requestText:
      'อยากลองชามัทฉะซากุระ หรือชาหอมหมื่นลี้โรยกลีบดอกไม้หอมๆ สักถ้วยค่ะ',
    preferredTeaIds: ['sakura-matcha', 'osmanthus-oolong', 'chamomile-blossom'],
    preferredToppings: ['osmanthus', 'milk'],
    happyReply: 'กลิ่นดอกไม้ฟุ้งละมุนหัวใจเลยค่ะ ประทับใจมากเลย',
    gentleReply: 'หอมหวานกำลังดีเลยค่ะ ขอบคุณที่ชงให้ด้วยใจนะคะ',
  },

  // คุณหมอภีม (สัตวแพทย์ใจดี)
  {
    guestId: 'pheem',
    minLevel: 1,
    requestText:
      'พักเบรกจากคลินิกครับ ขอเซนฉะยอดอ่อนหรือเกียวโตมัทฉะสดชื่นสบายท้องสักถ้วยครับ',
    preferredTeaIds: ['spring-sencha', 'kyoto-matcha', 'gyokuro-green'],
    preferredTemp: 'hot',
    happyReply: 'สะอาดสดชื่นมากครับ รู้สึกผ่อนคลายขึ้นเยอะเลย',
    gentleReply: 'ดื่มง่ายกำลังดีเลยครับ ขอบคุณมากนะครับ',
  },
  {
    guestId: 'pheem',
    minLevel: 3,
    requestText:
      'วันนี้แดดค่อนข้างแรง ขอเกียวคุโระเย็นหรืออูจิ ชิซึคุ ไอซ์ เติมใบมินต์สดชื่นสักแก้วครับ',
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
    requestText:
      'อยากชิมมัทฉะตีฟองเนียนๆ หรือมัทฉะลาเต้เนื้อนุ่มๆ เป็นแรงบันดาลใจทำขนมวากาชิค่ะ',
    preferredCategories: ['matcha', 'latte'],
    preferredToppings: ['milk', 'milk-foam'],
    happyReply: 'เนื้อฟองเนียนละเอียดไร้ที่ติเลยค่ะ หวานกำลังดีมาก!',
    gentleReply: 'บาลานซ์รสชาติดีมากค่ะ ได้ไอเดียทำขนมคู่ชาแล้ว!',
  },
  {
    guestId: 'meilin',
    minLevel: 3,
    requestText:
      'ขอลาเต้โรเซตต้า หรือมัทฉะฟักทองสไปซ์หอมเครื่องเทศอุ่นๆ คู่ขนมหวานหน่อยนะคะ',
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
    requestText:
      'เพิ่งกลับจากถ่ายภาพนอกสถานที่ ขอชาไทยโบราณใส่น้ำแข็งเย็นจัด หรือมัทฉะลาเต้เย็นสักแก้วครับ!',
    preferredTeaIds: ['thai-tea', 'iced-matcha-latte', 'uji-shizuku-ice'],
    preferredTemp: 'iced',
    preferredToppings: ['ice', 'milk'],
    happyReply: 'ชื่นใจสุดๆ ไปเลยครับ! เข้มข้นสะใจหายร้อนเลย',
    gentleReply: 'เย็นกำลังดีเลยครับ มีพลังลุยถ่ายรูปต่อแล้ว!',
  },
  {
    guestId: 'win',
    minLevel: 2,
    requestText:
      'ช่วงเย็นแสงสวยแบบนี้ ขอเอิร์ลเกรย์ฝานเลมอน หรืออัญชันมินต์เย็นสักแก้วไว้นั่งคัดรูปครับ',
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
    requestText:
      'สอนดนตรีเสร็จแวะมาชุ่มคอค่ะ ขอชาอู่หลงหอมๆ หรือคาโมมายล์อุ่นๆ สักถ้วยนะคะ',
    preferredCategories: ['oolong', 'herbal'],
    preferredTemp: 'hot',
    happyReply: 'หอมละมุนชุ่มคอไพเราะเหมือนเสียงขิมเลยค่ะ ฝีมือดีจริงเชียว',
    gentleReply: 'ชุ่มคอสบายใจมากเลยค่ะ ขอบคุณมากนะจ๊ะ',
  },
  {
    guestId: 'chandra',
    minLevel: 2,
    requestText:
      'วันนี้ป้าอยากชิมชาหอมหมื่นลี้ หรือทิกวนอิมร้อนๆ ที่กลิ่นหอมประณีตสักถ้วยนะคะ',
    preferredTeaIds: ['osmanthus-oolong', 'tieguanyin-oolong', 'darjeeling-black'],
    preferredTemp: 'hot',
    preferredToppings: ['osmanthus'],
    happyReply: 'กลิ่นหอมสง่างามมากเลยค่ะ จิบแล้วจิตใจสงบงดงามจริงๆ',
    gentleReply: 'รสชาตินุ่มนวลดีมากค่ะ ป้าชอบร้านนี้มากเลย',
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

  // Uniformly pick among distinct eligible guests first so all 12 customers appear with equal variety
  const eligibleGuestIds = Array.from(new Set(pool.map((t) => t.guestId)));
  const pickedGuestId =
    eligibleGuestIds[Math.floor(Math.random() * eligibleGuestIds.length)];
  const guestTemplates = pool.filter((t) => t.guestId === pickedGuestId);
  const picked =
    guestTemplates[Math.floor(Math.random() * guestTemplates.length)] ??
    pool[0];

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
