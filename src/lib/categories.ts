export interface CategoryMeta {
  id: string;
  name: string;
  nameTh: string;
  color: string;
  glyph: string;
  tags: string[];
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  DeepSouth: {
    id: "DeepSouth",
    name: "Deep South",
    nameTh: "ชายแดนใต้",
    color: "#d7a46d",
    glyph: "●",
    tags: [
      "deepsouth",
      "deep south",
      "ชายแดนใต้",
      "ปัตตานี",
      "pattani",
      "patani",
      "ปาตานี",
      "ภาคใต้",
      "ยะลา",
      "นราธิวาส",
      "กรือเซะ",
      "ตากใบ",
      "separatism",
      "แบ่งแยกดินแดน",
    ],
  },
  History: {
    id: "History",
    name: "History",
    nameTh: "ประวัติศาสตร์",
    color: "#a9b77c",
    glyph: "■",
    tags: [
      "history",
      "ประวัติศาสตร์",
      "14 ตุลา",
      "6 ตุลา",
      "2475",
      "รัชกาลที่ 5",
      "rama v",
      "colonialism",
      "archaeology",
      "โบราณคดี",
      "สงครามเย็น",
      "cold war",
    ],
  },
  Philosophy: {
    id: "Philosophy",
    name: "Philosophy",
    nameTh: "ปรัชญา",
    color: "#c29bc8",
    glyph: "◆",
    tags: [
      "philosophy",
      "ปรัชญา",
      "derrida",
      "foucault",
      "nietzsche",
      "heidegger",
      "postmodernism",
      "post-structuralism",
      "หลังสมัยใหม่",
      "deconstruction",
      "epistemology",
      "ญาณวิทยา",
      "ethics",
      "จริยศาสตร์",
      "aesthetics",
      "สุนทรียศาสตร์",
    ],
  },
  Islam: {
    id: "Islam",
    name: "Islam",
    nameTh: "อิสลามศึกษา",
    color: "#71b7ae",
    glyph: "▲",
    tags: [
      "islam",
      "อิสลาม",
      "muslim",
      "มุสลิม",
      "pondok",
      "ปอเนาะ",
      "sharia",
      "ฮัจญ์",
      "quran",
      "กุรอาน",
      "ศาสนาอิสลาม",
    ],
  },
  Nationalism: {
    id: "Nationalism",
    name: "Nationalism",
    nameTh: "ชาตินิยม",
    color: "#d37d70",
    glyph: "⬟",
    tags: [
      "nationalism",
      "ชาตินิยม",
      "nation",
      "ชาติ",
      "รัฐชาติ",
      "nation-state",
      "geo-body",
      "สยามมินทร์",
      "ราชาชาตินิยม",
      "ความมั่นคง",
      "sovereignty",
      "อธิปไตย",
    ],
  },
  Politics: {
    id: "Politics",
    name: "Politics",
    nameTh: "การเมืองและสิทธิ",
    color: "#8b9dcf",
    glyph: "✦",
    tags: [
      "politics",
      "การเมือง",
      "democracy",
      "ประชาธิปไตย",
      "human rights",
      "สิทธิมนุษยชน",
      "constitution",
      "รัฐธรรมนูญ",
      "รัฐประหาร",
      "coup",
      "state",
      "รัฐ",
      "noam chomsky",
      "civil society",
      "ประชาสังคม",
    ],
  },
  Anthropology: {
    id: "Anthropology",
    name: "Anthropology",
    nameTh: "มานุษยวิทยา",
    color: "#d3bd73",
    glyph: "⬢",
    tags: [
      "anthropology",
      "มานุษยวิทยา",
      "sociology",
      "สังคมวิทยา",
      "culture",
      "วัฒนธรรม",
      "ethnicity",
      "ชาติพันธุ์",
      "gender",
      "เพศสถานะ",
      "sacred space",
      "พื้นที่ศักดิ์สิทธิ์",
      "ritual",
      "พิธีกรรม",
      "community",
      "ชุมชน",
    ],
  },
  Other: {
    id: "Other",
    name: "Other",
    nameTh: "ทั่วไป",
    color: "#9a958e",
    glyph: "○",
    tags: [],
  },
};

export function getCategoryForTag(tag: string): CategoryMeta {
  const normalized = tag.trim().toLowerCase();
  for (const cat of Object.values(CATEGORIES)) {
    if (cat.id === "Other") continue;
    if (cat.tags.some((t) => t.toLowerCase() === normalized || normalized.includes(t.toLowerCase()))) {
      return cat;
    }
  }
  return CATEGORIES.Other;
}

export function getCategoryColor(categoryOrTag: string): string {
  if (CATEGORIES[categoryOrTag]) {
    return CATEGORIES[categoryOrTag].color;
  }
  return getCategoryForTag(categoryOrTag).color;
}
