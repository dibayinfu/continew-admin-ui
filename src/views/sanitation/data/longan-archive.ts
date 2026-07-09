export interface LonganTownArchive {
  name: string
  code: string
  lng: number
  lat: number
  population: number
  villageCount: number
  wasteTons: number
  boxCount: number
  transferBoxCount: number
  tricycleCount: number
}

export interface LonganVillageArchive {
  town: string
  name: string
  code: string
  lng: number
  lat: number
  population: number
  wasteTons: number
  boxCount: number
  transferBoxCount: number
  tricycleCount: number
  cleanerCount: number
}

export const longanTownArchives: LonganTownArchive[] = [
  { name: '田村街道', code: '410506001', lng: 114.33918, lat: 35.98883, population: 9667, villageCount: 5, wasteTons: 5.22, boxCount: 10, transferBoxCount: 11, tricycleCount: 24 },
  { name: '彰武街道', code: '410506002', lng: 114.126369, lat: 36.091783, population: 16309, villageCount: 7, wasteTons: 8.807, boxCount: 18, transferBoxCount: 18, tricycleCount: 41 },
  { name: '文昌街道', code: '410506003', lng: 114.35383, lat: 36.07123, population: 6761, villageCount: 5, wasteTons: 3.651, boxCount: 7, transferBoxCount: 8, tricycleCount: 17 },
  { name: '龙泉镇', code: '410506100', lng: 114.18042, lat: 36.06201, population: 32559, villageCount: 33, wasteTons: 17.582, boxCount: 35, transferBoxCount: 36, tricycleCount: 81 },
  { name: '马投涧镇', code: '410506101', lng: 114.25374, lat: 36.01028, population: 53364, villageCount: 44, wasteTons: 28.817, boxCount: 58, transferBoxCount: 58, tricycleCount: 133 },
  { name: '善应镇', code: '410506103', lng: 114.12726, lat: 36.05026, population: 31278, villageCount: 22, wasteTons: 16.89, boxCount: 34, transferBoxCount: 34, tricycleCount: 78 },
  { name: '东风乡', code: '410506201', lng: 114.29698, lat: 36.09236, population: 32792, villageCount: 19, wasteTons: 17.708, boxCount: 35, transferBoxCount: 36, tricycleCount: 82 },
  { name: '马家乡', code: '410506205', lng: 114.0223, lat: 36.03727, population: 29762, villageCount: 22, wasteTons: 16.071, boxCount: 32, transferBoxCount: 33, tricycleCount: 74 },
]

export const longanVillageArchives: LonganVillageArchive[] = [
  { town: '田村街道', name: '南田村', code: '410506001200', lng: 114.3401, lat: 35.97035, population: 2856, wasteTons: 1.542, boxCount: 3, transferBoxCount: 4, tricycleCount: 7, cleanerCount: 7 },
  { town: '田村街道', name: '北田村', code: '410506001201', lng: 114.33894, lat: 35.98839, population: 2261, wasteTons: 1.221, boxCount: 2, transferBoxCount: 3, tricycleCount: 6, cleanerCount: 6 },
  { town: '田村街道', name: '丁家庄村', code: '410506001202', lng: 114.32808, lat: 36.00162, population: 1058, wasteTons: 0.571, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '田村街道', name: '郜家庄村', code: '410506001203', lng: 114.33573, lat: 36.00396, population: 2184, wasteTons: 1.179, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '田村街道', name: '杨家庄村', code: '410506001204', lng: 114.34389, lat: 36.00117, population: 1308, wasteTons: 0.706, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '彰武街道', name: '张家庄村', code: '410506002200', lng: 114.11576, lat: 36.09175, population: 2000, wasteTons: 1.08, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '彰武街道', name: '北彰武村', code: '410506002201', lng: 114.13552, lat: 36.1025, population: 4288, wasteTons: 2.316, boxCount: 5, transferBoxCount: 5, tricycleCount: 11, cleanerCount: 11 },
  { town: '彰武街道', name: '南彰武村', code: '410506002202', lng: 114.13788, lat: 36.08244, population: 1029, wasteTons: 0.556, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '彰武街道', name: '东龙山村', code: '410506002203', lng: 114.11838, lat: 36.08469, population: 1400, wasteTons: 0.756, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '彰武街道', name: '西高平村', code: '410506002204', lng: 114.149, lat: 36.10222, population: 4217, wasteTons: 2.277, boxCount: 5, transferBoxCount: 5, tricycleCount: 11, cleanerCount: 11 },
  { town: '彰武街道', name: '北方山村', code: '410506002205', lng: 114.12611, lat: 36.0802, population: 1720, wasteTons: 0.929, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '彰武街道', name: '中龙山村', code: '410506002206', lng: 114.10193, lat: 36.09868, population: 1655, wasteTons: 0.894, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '文昌街道', name: '宗村', code: '410506003200', lng: 114.32453, lat: 36.06788, population: 3200, wasteTons: 1.728, boxCount: 3, transferBoxCount: 4, tricycleCount: 8, cleanerCount: 8 },
  { town: '文昌街道', name: '侯七里村', code: '410506003202', lng: 114.33294, lat: 36.06292, population: 2034, wasteTons: 1.098, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '文昌街道', name: '李七里村', code: '410506003203', lng: 114.33342, lat: 36.05847, population: 840, wasteTons: 0.454, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '文昌街道', name: '肖七里村', code: '410506003201', lng: 114.3299, lat: 36.06405, population: 285, wasteTons: 0.154, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '文昌街道', name: '苏七里村', code: '410506003204', lng: 114.33493, lat: 36.05371, population: 402, wasteTons: 0.217, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '龙泉村', code: '410506100200', lng: 114.17589, lat: 36.06345, population: 2106, wasteTons: 1.137, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '龙泉镇', name: '陈家坡', code: '410506100201', lng: 114.18543, lat: 36.0651, population: 639, wasteTons: 0.345, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '东平', code: '410506100202', lng: 114.17922, lat: 36.05084, population: 1857, wasteTons: 1.003, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '龙泉镇', name: '吴家洞', code: '410506100203', lng: 114.15832, lat: 36.05311, population: 1952, wasteTons: 1.054, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '龙泉镇', name: '梨树厂', code: '410506100204', lng: 114.14546, lat: 36.05771, population: 812, wasteTons: 0.438, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '东方山', code: '410506100205', lng: 114.13182, lat: 36.0659, population: 2249, wasteTons: 1.214, boxCount: 2, transferBoxCount: 3, tricycleCount: 6, cleanerCount: 6 },
  { town: '龙泉镇', name: '九堰', code: '410506100206', lng: 114.152, lat: 36.06859, population: 2246, wasteTons: 1.213, boxCount: 2, transferBoxCount: 3, tricycleCount: 6, cleanerCount: 6 },
  { town: '龙泉镇', name: '大涧', code: '410506100207', lng: 114.17336, lat: 36.07311, population: 880, wasteTons: 0.475, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '牛家岗', code: '410506100208', lng: 114.16747, lat: 36.07721, population: 939, wasteTons: 0.507, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '圪道', code: '410506100209', lng: 114.16853, lat: 36.08204, population: 348, wasteTons: 0.188, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '后洞', code: '410506100210', lng: 114.17385, lat: 36.08314, population: 506, wasteTons: 0.273, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '孟家庄', code: '410506100211', lng: 114.17946, lat: 36.08111, population: 1269, wasteTons: 0.685, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '龙泉镇', name: '平棘', code: '410506100212', lng: 114.18237, lat: 36.08546, population: 773, wasteTons: 0.417, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '西洪沟', code: '410506100213', lng: 114.19699, lat: 36.07752, population: 700, wasteTons: 0.378, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '东洪沟', code: '410506100214', lng: 114.20565, lat: 36.08231, population: 441, wasteTons: 0.238, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '周家庄', code: '410506100215', lng: 114.20585, lat: 36.08662, population: 737, wasteTons: 0.398, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '西上庄', code: '410506100216', lng: 114.19975, lat: 36.05954, population: 1074, wasteTons: 0.58, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '龙泉镇', name: '西沟', code: '410506100217', lng: 114.21186, lat: 36.07201, population: 827, wasteTons: 0.447, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '东上庄', code: '410506100218', lng: 114.21438, lat: 36.0607, population: 754, wasteTons: 0.407, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '楼庄', code: '410506100219', lng: 114.22253, lat: 36.07194, population: 982, wasteTons: 0.53, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '四门券', code: '410506100220', lng: 114.22232, lat: 36.07671, population: 1022, wasteTons: 0.552, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '龙泉镇', name: '李潘流', code: '410506100221', lng: 114.23843, lat: 36.07327, population: 733, wasteTons: 0.396, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '羊毛屯', code: '410506100222', lng: 114.24598, lat: 36.0728, population: 483, wasteTons: 0.261, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '师潘流', code: '410506100223', lng: 114.23522, lat: 36.06895, population: 759, wasteTons: 0.41, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '白龙庙', code: '410506100224', lng: 114.23264, lat: 36.05546, population: 1354, wasteTons: 0.731, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '龙泉镇', name: '张家岗', code: '410506100225', lng: 114.24253, lat: 36.06033, population: 403, wasteTons: 0.218, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '高北河', code: '410506100226', lng: 114.22386, lat: 36.04581, population: 1690, wasteTons: 0.913, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '龙泉镇', name: '张北河', code: '410506100227', lng: 114.21432, lat: 36.03921, population: 526, wasteTons: 0.284, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '张串村', code: '410506100228', lng: 114.19786, lat: 36.04099, population: 463, wasteTons: 0.25, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '全林', code: '410506100229', lng: 114.1836, lat: 36.03637, population: 243, wasteTons: 0.131, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '许串村', code: '410506100230', lng: 114.19476, lat: 36.0343, population: 575, wasteTons: 0.31, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '龙泉镇', name: '于串村', code: '410506100232', lng: 114.20017, lat: 36.03081, population: 671, wasteTons: 0.362, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '龙泉镇', name: '石岩', code: '410506100231', lng: 114.18784, lat: 36.02571, population: 1546, wasteTons: 0.835, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马投涧镇', name: '杜贺驼村', code: '410506101200', lng: 114.17752, lat: 36.00496, population: 1780, wasteTons: 0.961, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马投涧镇', name: '陈贺驼村', code: '410506101201', lng: 114.186, lat: 35.9924, population: 1472, wasteTons: 0.795, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马投涧镇', name: '郭贺驼村', code: '410506101202', lng: 114.19664, lat: 36.00274, population: 712, wasteTons: 0.384, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '老河沟村', code: '410506101203', lng: 114.18688, lat: 36.01006, population: 642, wasteTons: 0.347, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '张贺驼村', code: '410506101204', lng: 114.19646, lat: 35.99566, population: 689, wasteTons: 0.372, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '李各涧村', code: '410506101205', lng: 114.22433, lat: 36.00094, population: 2050, wasteTons: 1.107, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '马投涧镇', name: '马投涧村', code: '410506101206', lng: 114.25343, lat: 36.0107, population: 2801, wasteTons: 1.513, boxCount: 3, transferBoxCount: 4, tricycleCount: 7, cleanerCount: 7 },
  { town: '马投涧镇', name: '潘家安村', code: '410506101207', lng: 114.2649, lat: 36.00763, population: 950, wasteTons: 0.513, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '高白塔村', code: '410506101208', lng: 114.25046, lat: 35.98577, population: 1336, wasteTons: 0.721, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '马投涧镇', name: '崔白塔村', code: '410506101209', lng: 114.25624, lat: 35.97913, population: 1251, wasteTons: 0.676, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '马投涧镇', name: '刘各涧村', code: '410506101210', lng: 114.23692, lat: 35.98988, population: 852, wasteTons: 0.46, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '上下洞村', code: '410506101211', lng: 114.25626, lat: 35.99198, population: 973, wasteTons: 0.525, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '元二庄村', code: '410506101212', lng: 114.27715, lat: 35.99315, population: 2688, wasteTons: 1.452, boxCount: 3, transferBoxCount: 3, tricycleCount: 7, cleanerCount: 7 },
  { town: '马投涧镇', name: '港里村', code: '410506101213', lng: 114.29074, lat: 35.98243, population: 1560, wasteTons: 0.842, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马投涧镇', name: '王二岗村', code: '410506101214', lng: 114.30803, lat: 35.98566, population: 3952, wasteTons: 2.134, boxCount: 4, transferBoxCount: 5, tricycleCount: 10, cleanerCount: 10 },
  { town: '马投涧镇', name: '坟洼村', code: '410506101215', lng: 114.26906, lat: 36.01585, population: 1725, wasteTons: 0.931, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马投涧镇', name: '南大岷村', code: '410506101216', lng: 114.27832, lat: 36.00612, population: 1556, wasteTons: 0.84, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马投涧镇', name: '何大岷村', code: '410506101217', lng: 114.29484, lat: 36.01488, population: 1860, wasteTons: 1.004, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '马投涧镇', name: '北大岷村', code: '410506101218', lng: 114.28645, lat: 36.0193, population: 1054, wasteTons: 0.569, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '马投涧镇', name: '郭大岷村', code: '410506101219', lng: 114.29172, lat: 36.02425, population: 596, wasteTons: 0.322, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马投涧镇', name: '杨大岷村', code: '410506101220', lng: 114.29719, lat: 36.0081, population: 680, wasteTons: 0.367, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '牛家窑村', code: '410506101221', lng: 114.2777, lat: 36.02222, population: 702, wasteTons: 0.379, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '大屯村', code: '410506101222', lng: 114.31015, lat: 36.01141, population: 1973, wasteTons: 1.065, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '马投涧镇', name: '柏家村村', code: '410506101223', lng: 114.31855, lat: 36.00673, population: 767, wasteTons: 0.414, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '孟家炉村', code: '410506101224', lng: 114.32398, lat: 36.00542, population: 644, wasteTons: 0.348, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '辛庄村', code: '410506101225', lng: 114.32683, lat: 36.01821, population: 1892, wasteTons: 1.022, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '马投涧镇', name: '上毛仪涧村', code: '410506101226', lng: 114.31295, lat: 36.03236, population: 2134, wasteTons: 1.152, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '马投涧镇', name: '下毛仪涧村', code: '410506101227', lng: 114.32295, lat: 36.04238, population: 982, wasteTons: 0.53, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '齐村村', code: '410506101228', lng: 114.28881, lat: 36.04091, population: 2194, wasteTons: 1.185, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '马投涧镇', name: '张家庄村', code: '410506101229', lng: 114.29883, lat: 36.05089, population: 799, wasteTons: 0.431, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '宋家堂村', code: '410506101230', lng: 114.25758, lat: 36.04206, population: 977, wasteTons: 0.528, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '李家窑村', code: '410506101231', lng: 114.27376, lat: 36.05454, population: 1250, wasteTons: 0.675, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '马投涧镇', name: '高小屯村', code: '410506101232', lng: 114.26591, lat: 36.05455, population: 1098, wasteTons: 0.593, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '马投涧镇', name: '下马泉村', code: '410506101233', lng: 114.26554, lat: 36.04562, population: 789, wasteTons: 0.426, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '南坡村', code: '410506101234', lng: 114.2466, lat: 36.02906, population: 705, wasteTons: 0.381, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '水涧村', code: '410506101235', lng: 114.25566, lat: 36.02724, population: 658, wasteTons: 0.355, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '后河村', code: '410506101236', lng: 114.24611, lat: 36.03389, population: 343, wasteTons: 0.185, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马投涧镇', name: '西岸村', code: '410506101237', lng: 114.23897, lat: 36.03011, population: 928, wasteTons: 0.501, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '牛家庄村', code: '410506101238', lng: 114.23131, lat: 36.02769, population: 930, wasteTons: 0.502, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '盘龙寺村', code: '410506101239', lng: 114.22435, lat: 36.02598, population: 580, wasteTons: 0.313, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马投涧镇', name: '李家安村', code: '410506101240', lng: 114.23068, lat: 36.00772, population: 353, wasteTons: 0.191, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马投涧镇', name: '张家村', code: '410506101241', lng: 114.21663, lat: 36.02526, population: 433, wasteTons: 0.234, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马投涧镇', name: '郭家村', code: '410506101242', lng: 114.21151, lat: 36.0249, population: 858, wasteTons: 0.463, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马投涧镇', name: '冯家桥村', code: '410506101243', lng: 114.23955, lat: 35.99261, population: 196, wasteTons: 0.106, boxCount: 0, transferBoxCount: 1, tricycleCount: 0, cleanerCount: 0 },
  { town: '善应镇', name: '三仓', code: '410506103201', lng: 114.07746, lat: 35.99075, population: 1470, wasteTons: 0.794, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '善应镇', name: '大平', code: '410506103203', lng: 114.07469, lat: 35.99734, population: 1164, wasteTons: 0.629, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '善应镇', name: '西善应', code: '410506103204', lng: 114.08064, lat: 36.01396, population: 1386, wasteTons: 0.748, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '善应镇', name: '张二庄', code: '410506103207', lng: 114.08909, lat: 36.02996, population: 1030, wasteTons: 0.556, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '善应镇', name: '化向', code: '410506103212', lng: 114.07909, lat: 35.98318, population: 520, wasteTons: 0.281, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '善应镇', name: '东山', code: '410506103206', lng: 114.09186, lat: 36.01231, population: 235, wasteTons: 0.127, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '善应镇', name: '珍珠', code: '410506103202', lng: 114.08446, lat: 36.0016, population: 382, wasteTons: 0.206, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '善应镇', name: '白玉', code: '410506103208', lng: 114.10752, lat: 36.0276, population: 723, wasteTons: 0.39, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '善应镇', name: '杨家坪', code: '410506103209', lng: 114.10386, lat: 36.03619, population: 1151, wasteTons: 0.622, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '善应镇', name: '黑玉', code: '410506103210', lng: 114.10317, lat: 36.04446, population: 1093, wasteTons: 0.59, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '善应镇', name: '北善应', code: '410506103200', lng: 114.11911, lat: 36.04613, population: 3350, wasteTons: 1.809, boxCount: 4, transferBoxCount: 4, tricycleCount: 8, cleanerCount: 8 },
  { town: '善应镇', name: '南善应', code: '410506103211', lng: 114.12514, lat: 36.04403, population: 3558, wasteTons: 1.921, boxCount: 4, transferBoxCount: 4, tricycleCount: 9, cleanerCount: 9 },
  { town: '善应镇', name: '东滩', code: '410506103222', lng: 114.12769, lat: 36.05128, population: 1358, wasteTons: 0.733, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '善应镇', name: '西方山', code: '410506103213', lng: 114.12137, lat: 36.06847, population: 935, wasteTons: 0.505, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '善应镇', name: '天喜镇', code: '410506103214', lng: 114.11283, lat: 36.07464, population: 4081, wasteTons: 2.204, boxCount: 4, transferBoxCount: 5, tricycleCount: 10, cleanerCount: 10 },
  { town: '善应镇', name: '南平', code: '410506103216', lng: 114.07264, lat: 36.06585, population: 4251, wasteTons: 2.296, boxCount: 5, transferBoxCount: 5, tricycleCount: 11, cleanerCount: 11 },
  { town: '善应镇', name: '中城', code: '410506103215', lng: 114.09356, lat: 36.07018, population: 1012, wasteTons: 0.546, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '善应镇', name: '谢家庄', code: '410506103217', lng: 114.07346, lat: 36.07571, population: 862, wasteTons: 0.465, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '善应镇', name: '南龙山', code: '410506103219', lng: 114.0984, lat: 36.0932, population: 885, wasteTons: 0.478, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '善应镇', name: '西龙山', code: '410506103220', lng: 114.09707, lat: 36.09686, population: 814, wasteTons: 0.44, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '善应镇', name: '冯家洞', code: '410506103218', lng: 114.08408, lat: 36.08717, population: 660, wasteTons: 0.356, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '善应镇', name: '南郊', code: '410506103205', lng: 114.08537, lat: 36.00508, population: 358, wasteTons: 0.193, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '东风乡', name: '活  水', code: '410506201201', lng: 114.30055, lat: 36.06107, population: 2278, wasteTons: 1.23, boxCount: 2, transferBoxCount: 3, tricycleCount: 6, cleanerCount: 6 },
  { town: '东风乡', name: '赵张村', code: '410506201202', lng: 114.28258, lat: 36.0708, population: 2049, wasteTons: 1.106, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '东风乡', name: '黄张村', code: '410506201203', lng: 114.27464, lat: 36.06537, population: 1265, wasteTons: 0.683, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '东风乡', name: '许张村', code: '410506201204', lng: 114.28444, lat: 36.06665, population: 841, wasteTons: 0.454, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '东风乡', name: '红  星', code: '410506201205', lng: 114.25925, lat: 36.07431, population: 1306, wasteTons: 0.705, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '东风乡', name: '海  村', code: '410506201206', lng: 114.26807, lat: 36.07373, population: 914, wasteTons: 0.494, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '东风乡', name: '大  坡', code: '410506201218', lng: 114.27131, lat: 36.09655, population: 2665, wasteTons: 1.439, boxCount: 3, transferBoxCount: 3, tricycleCount: 7, cleanerCount: 7 },
  { town: '东风乡', name: '小  坡', code: '410506201219', lng: 114.26425, lat: 36.09808, population: 1233, wasteTons: 0.666, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '东风乡', name: '徐家口', code: '410506201220', lng: 114.25378, lat: 36.10035, population: 1056, wasteTons: 0.57, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '东风乡', name: '盖村铺', code: '410506201221', lng: 114.24664, lat: 36.10013, population: 1676, wasteTons: 0.905, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '东风乡', name: '西盖村', code: '410506201222', lng: 114.23958, lat: 36.10526, population: 2061, wasteTons: 1.113, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '东风乡', name: '申家岗', code: '410506201223', lng: 114.25349, lat: 36.09383, population: 2687, wasteTons: 1.451, boxCount: 3, transferBoxCount: 3, tricycleCount: 7, cleanerCount: 7 },
  { town: '东风乡', name: '三分庄', code: '410506201224', lng: 114.27171, lat: 36.0899, population: 1344, wasteTons: 0.726, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '东风乡', name: '老  庄', code: '410506201225', lng: 114.27085, lat: 36.08237, population: 1513, wasteTons: 0.817, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '东风乡', name: '郭潘流', code: '410506201227', lng: 114.25956, lat: 36.0829, population: 1272, wasteTons: 0.687, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '东风乡', name: '王潘流', code: '410506201228', lng: 114.2516, lat: 36.07843, population: 2083, wasteTons: 1.125, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '东风乡', name: '麻鞋店', code: '410506201229', lng: 114.25198, lat: 36.08501, population: 1688, wasteTons: 0.912, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '东风乡', name: '郭里东', code: '410506201230', lng: 114.22782, lat: 36.08656, population: 2249, wasteTons: 1.214, boxCount: 2, transferBoxCount: 3, tricycleCount: 6, cleanerCount: 6 },
  { town: '东风乡', name: '郭里西', code: '410506201231', lng: 114.22313, lat: 36.08694, population: 2612, wasteTons: 1.41, boxCount: 3, transferBoxCount: 3, tricycleCount: 7, cleanerCount: 7 },
  { town: '马家乡', name: '科泉村', code: '410506205203', lng: 114.00306, lat: 36.06229, population: 7040, wasteTons: 3.802, boxCount: 8, transferBoxCount: 8, tricycleCount: 18, cleanerCount: 18 },
  { town: '马家乡', name: '丁庄村', code: '410506205204', lng: 113.99348, lat: 36.04521, population: 982, wasteTons: 0.53, boxCount: 1, transferBoxCount: 2, tricycleCount: 2, cleanerCount: 2 },
  { town: '马家乡', name: '王家岗村', code: '410506205201', lng: 114.02208, lat: 36.04988, population: 1496, wasteTons: 0.808, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马家乡', name: '东坡村', code: '410506205210', lng: 114.02358, lat: 36.03257, population: 608, wasteTons: 0.328, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马家乡', name: '池坡村', code: '410506205209', lng: 114.02095, lat: 36.02886, population: 419, wasteTons: 0.226, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马家乡', name: '北齐村', code: '410506205202', lng: 114.02581, lat: 36.05606, population: 1998, wasteTons: 1.079, boxCount: 2, transferBoxCount: 3, tricycleCount: 5, cleanerCount: 5 },
  { town: '马家乡', name: '贾家村', code: '410506205207', lng: 114.01397, lat: 36.03299, population: 716, wasteTons: 0.387, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马家乡', name: '南堰村', code: '410506205208', lng: 114.01401, lat: 36.02695, population: 1659, wasteTons: 0.896, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马家乡', name: '新大堰村', code: '410506205206', lng: 114.01232, lat: 36.03568, population: 810, wasteTons: 0.437, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马家乡', name: '交口村', code: '410506205212', lng: 114.04369, lat: 36.03902, population: 2601, wasteTons: 1.405, boxCount: 3, transferBoxCount: 3, tricycleCount: 7, cleanerCount: 7 },
  { town: '马家乡', name: '垴后村', code: '410506205221', lng: 114.04253, lat: 36.03146, population: 698, wasteTons: 0.377, boxCount: 1, transferBoxCount: 1, tricycleCount: 2, cleanerCount: 2 },
  { town: '马家乡', name: '东垴村', code: '410506205220', lng: 114.03458, lat: 36.02868, population: 1290, wasteTons: 0.697, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '马家乡', name: '李庄村', code: '410506205219', lng: 114.0469, lat: 36.02262, population: 1500, wasteTons: 0.81, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马家乡', name: '马家村', code: '410506205200', lng: 114.02434, lat: 36.03716, population: 1260, wasteTons: 0.68, boxCount: 1, transferBoxCount: 2, tricycleCount: 3, cleanerCount: 3 },
  { town: '马家乡', name: '大桥村', code: '410506205211', lng: 114.02106, lat: 36.03671, population: 298, wasteTons: 0.161, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马家乡', name: '赵家村', code: '410506205205', lng: 114.01553, lat: 36.04075, population: 1410, wasteTons: 0.761, boxCount: 2, transferBoxCount: 2, tricycleCount: 4, cleanerCount: 4 },
  { town: '马家乡', name: '岭头村', code: '410506205218', lng: 114.04277, lat: 35.99531, population: 3286, wasteTons: 1.774, boxCount: 4, transferBoxCount: 4, tricycleCount: 8, cleanerCount: 8 },
  { town: '马家乡', name: '赵河村', code: '410506205216', lng: 114.0376, lat: 35.97313, population: 64, wasteTons: 0.035, boxCount: 0, transferBoxCount: 1, tricycleCount: 0, cleanerCount: 0 },
  { town: '马家乡', name: '龙尾岗村', code: '410506205217', lng: 114.05752, lat: 35.96669, population: 210, wasteTons: 0.113, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马家乡', name: '沙井村', code: '410506205215', lng: 114.02222, lat: 36.00058, population: 596, wasteTons: 0.322, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马家乡', name: '横岭村', code: '410506205213', lng: 114.00862, lat: 36.00082, population: 464, wasteTons: 0.251, boxCount: 1, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
  { town: '马家乡', name: '郭家窑村', code: '410506205214', lng: 114.01067, lat: 35.99544, population: 357, wasteTons: 0.193, boxCount: 0, transferBoxCount: 1, tricycleCount: 1, cleanerCount: 1 },
]

const PI = Math.PI
const AXIS = 6378245.0
const OFFSET = 0.006693421622965943

function transformLat(lng: number, lat: number) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLng(lng: number, lat: number) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

function outOfChina(lng: number, lat: number) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

export function wgs84ToGcj02(lng: number, lat: number) {
  if (outOfChina(lng, lat)) return { lng, lat }
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - OFFSET * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((AXIS * (1 - OFFSET)) / (magic * sqrtMagic) * PI)
  dLng = (dLng * 180.0) / (AXIS / sqrtMagic * Math.cos(radLat) * PI)
  return { lng: +(lng + dLng).toFixed(6), lat: +(lat + dLat).toFixed(6) }
}
