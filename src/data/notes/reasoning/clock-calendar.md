# घड्याळ व दिनदर्शिका (Clock & Calendar) — MPSC गट-क संयुक्त 2026

## परिचय / Introduction
- घड्याळ व दिनदर्शिका हा तर्कशक्ती (Reasoning) विभागातील महत्त्वाचा घटक आहे / Clock & Calendar is an important component of the Reasoning section.
- यात प्रामुख्याने दोन उपघटक असतात: (1) घड्याळाचे कोन व वेळ यावर आधारित प्रश्न (2) दिनदर्शिकेवर आधारित वार (Day) काढण्याचे प्रश्न / It mainly has two sub-parts: (1) Clock angle & time-based problems (2) Calendar-based problems to find the day of the week.
- स्पर्धा परीक्षेत साधारणपणे दरवर्षी 1-3 प्रश्न या घटकावर विचारले जातात / Generally 1-3 questions are asked from this topic every year in competitive exams.

## घड्याळाची मूलभूत रचना / Basic Structure of a Clock
- घड्याळाचा डायल (Dial) हे वर्तुळ 360 अंशांचे असते व त्यावर 12 अंक (1 ते 12) समान अंतरावर असतात / The clock dial is a circle of 360 degrees with 12 numbers (1 to 12) equally spaced.
- 12 अंकांमधील एकूण अंतर 360°, त्यामुळे दोन लागोपाठ अंकांमधील कोन = 360°/12 = 30° / The angle between two consecutive numbers = 360°/12 = 30°.
- प्रत्येक अंकादरम्यान 5 मिनिटांचे अंतर असते (एकूण 60 मिनिटे) / There are 5-minute gaps between consecutive numbers (total 60 minutes).
- मिनिट काट्याचा (Minute hand) वेग: 1 मिनिटात 6° फिरतो (360°/60) / Minute hand speed: moves 6° per minute (360°/60).
- तास काट्याचा (Hour hand) वेग: 1 तासात 30° फिरतो, म्हणजे 1 मिनिटात 0.5° फिरतो (30°/60) / Hour hand speed: moves 30° per hour, i.e., 0.5° per minute.
- सेकंद काट्याचा (Second hand) वेग: 1 सेकंदात 6° फिरतो (360°/60) / Second hand speed: moves 6° per second.
- तास काटा मिनिट काट्यापेक्षा 11 पट हळू फिरतो, म्हणजे सापेक्ष वेग = 6° - 0.5° = 5.5° प्रति मिनिट / The hour hand moves 11 times slower than the minute hand; relative speed = 6° - 0.5° = 5.5° per minute.

## कोन काढण्याचे सूत्र / Formula for Finding Angle
- मूळ सूत्र: कोन = |30H - (11/2)M| अंश, जिथे H = तास (12-तासी स्वरूपात) आणि M = मिनिटे / Basic formula: Angle = |30H - (11/2)M| degrees, where H = hour (in 12-hour format) and M = minutes.
- जर मिळालेला कोन 180° पेक्षा जास्त असेल, तर प्रत्यक्ष कोन = 360° - मिळालेला कोन (कारण कोन नेहमी ≤180° घेतला जातो) / If the resulting angle exceeds 180°, actual angle = 360° - calculated angle (since angle is always taken ≤180°).
- उदाहरण: 3:00 वाजता कोन = |30×3 - (11/2)×0| = 90° / Example: At 3:00, angle = |30×3 - (11/2)×0| = 90°.
- उदाहरण: 4:30 वाजता कोन = |30×4 - (11/2)×30| = |120 - 165| = 45° / Example: At 4:30, angle = |30×4 - (11/2)×30| = |120-165| = 45°.
- उदाहरण: 6:00 वाजता कोन = 180° (दोन्ही काटे सरळ रेषेत, विरुद्ध दिशेला) / Example: At 6:00, angle = 180° (both hands in a straight line, opposite directions).
- उदाहरण: 9:00 वाजता कोन = 90° / Example: At 9:00, angle = 90°.

## विशेष स्थिती — काटे एकत्र (Coincide) / Special Case — Hands Coincide
- दोन्ही काटे एकत्र येण्यासाठी कोन = 0° असावा लागतो / For hands to coincide, angle must be 0°.
- 12 तासांत काटे एकूण 11 वेळा एकत्र येतात (12:00 सोडून पुढील प्रत्येक वेळी) / In 12 hours, hands coincide 11 times.
- 24 तासांत (एक पूर्ण दिवसात) काटे 22 वेळा एकत्र येतात / In 24 hours (a full day), hands coincide 22 times.
- दोन एकत्र येण्याच्या वेळेतील अंतर = 12/11 तास = 65 (5/11) मिनिटे / Time gap between two consecutive coincidences = 12/11 hours = 65(5/11) minutes.
- सूत्र: H नंतर काटे एकत्र येण्याची वेळ = H:00 पासून (60H/11×5)... प्रत्यक्षात वापरण्याचे सोपे सूत्र: प्रत्येक तासानंतर काटे 65(5/11) मिनिटांनी एकत्र येतात / Simplified: after every hour mark, hands meet again after 65(5/11) minutes.

## विशेष स्थिती — काटे सरळ रेषेत (180°) / Special Case — Hands in Straight Line (Opposite, 180°)
- 12 तासांत काटे 11 वेळा एकमेकांच्या विरुद्ध दिशेला (180°) येतात / In 12 hours, hands are opposite (180°) 11 times.
- 24 तासांत ही स्थिती 22 वेळा येते / In 24 hours, this occurs 22 times.
- साधारण 5:00 ते 7:00 दरम्यान ही स्थिती फक्त एकदाच येते (6:00 च्या आसपास) हे लक्षात ठेवावे / Note: between 5:00-7:00 this occurs only once (near 6:00).
- दोन सरळ रेषेतील स्थितींमधील अंतर = 65(5/11) मिनिटे (कोइन्सिडन्स प्रमाणेच) / Gap between two opposite-line positions = 65(5/11) minutes (same as coincidence gap).

## विशेष स्थिती — काटे लंब (90°) / Special Case — Hands at Right Angle (90°)
- 12 तासांत काटे 22 वेळा 90° चा कोन करतात (प्रत्येक तासात साधारण 2 वेळा, पण काही तासांत अपवाद) / In 12 hours, hands form 90° angle 22 times.
- 24 तासांत ही स्थिती 44 वेळा येते / In 24 hours, this occurs 44 times.
- दोन सलग काटे-लंब स्थितींमधील सरासरी अंतर = 32(8/11) मिनिटे / Average gap between two consecutive right-angle positions ≈ 32(8/11) minutes.

## सेकंद काट्यासह प्रश्न / Problems Involving Second Hand
- तास व मिनिट काटे 12 तासांत 11 वेळा एकत्र येतात; तिन्ही काटे (तास, मिनिट, सेकंद) फक्त 12:00 वाजता एकत्र येतात / Hour and minute hands coincide 11 times in 12 hours; all three hands (hour, minute, second) coincide only at 12:00.
- सेकंद काट्याचा सापेक्ष वेग मिनिट काट्यापेक्षा जास्त असल्याने सेकंद काट्यासंबंधी कोन काढताना M ऐवजी सेकंदांचा वापर सूत्रात करावा लागतो / Since the second hand moves faster than the minute hand, use seconds in place of minutes in relevant formulas when needed.

## आरशातील प्रतिमा (Mirror Image) / Mirror Image of Clock
- आरशातील वेळ काढण्याचे सूत्र: आरसा वेळ = 11:60 (म्हणजे 12:00) - दिलेली वेळ / Mirror image time formula = 11:60 (i.e., 12:00) − given time.
- उदाहरण: 4:30 ची आरसा प्रतिमा = 11:60 - 4:30 = 7:30 / Example: Mirror image of 4:30 = 11:60 − 4:30 = 7:30.
- उदाहरण: 8:20 ची आरसा प्रतिमा = 11:60 - 8:20 = 3:40 / Example: Mirror image of 8:20 = 11:60 − 8:20 = 3:40.
- जर वेळ 12 तासांपेक्षा जास्त (उदा. दुपारनंतरची) दिली असेल तर प्रथम 12-तासी स्वरूपात रूपांतर करावे / If the given time is beyond 12-hour format, convert to 12-hour form first.

## पाण्यातील प्रतिमा (Water Image) / Water Image of Clock
- पाण्यातील प्रतिमेचे सूत्र: पाणी प्रतिमा वेळ = 6:00 - दिलेली वेळ (किंवा दिलेली वेळ 6:00 पेक्षा जास्त असल्यास 18:00 मधून वजा) / Water image formula = 6:00 − given time (or subtract from 18:00 if beyond 6:00).
- उदाहरण: 3:00 ची पाणी प्रतिमा = 6:00 - 3:00 = 3:00... वास्तविक सूत्र: जर वेळ H:M असेल तर पाणी प्रतिमा = (17:60 - H:M) 12-तासी रूपात / Example: For time H:M, water image = (17:60 − H:M) converted to 12-hour format.
- सराव प्रश्नांत आरसा व पाणी प्रतिमा वेगळे ओळखणे महत्त्वाचे — आरसा उभी अक्षाने (12-6 रेषा), पाणी आडवी अक्षाने (9-3 रेषा) परावर्तित करतो / Distinguish: mirror reflects along vertical (12-6) axis, water image reflects along horizontal (9-3) axis.

## घड्याळ पुढे/मागे जाणे (Fast/Slow Clock) / Gaining and Losing Time
- जलद घड्याळ (Fast clock) प्रत्यक्ष वेळेपेक्षा जास्त वेळ दाखवते; मंद घड्याळ (Slow clock) कमी वेळ दाखवते / A fast clock shows more time than actual; a slow clock shows less.
- 24 तासांत घड्याळाने योग्य वेळ दाखवावी यासाठी पुढे गेलेली/मागे राहिलेली मिनिटे मोजून समायोजन (Correction) काढतात / Corrections are calculated by measuring minutes gained/lost over 24 hours.
- सूत्र: जर घड्याळ ठराविक तासांत ठराविक मिनिटे पुढे/मागे जात असेल, तर प्रत्यक्ष 24 तासांसाठी प्रमाण काढून (Unitary Method) उत्तर काढतात / Use the unitary method — set up a proportion based on given hours to minutes gained/lost, scale to 24 hours.
- उदाहरण: घड्याळ दर तासाला 2 मिनिटे पुढे जाते, तर 24 तासांत ते 48 मिनिटे पुढे जाईल / Example: If a clock gains 2 minutes every hour, it gains 48 minutes in 24 hours.
- "योग्य वेळी दाखवणारे घड्याळ" (Correct clock) दिवसातून 2 वेळा (12:00 आणि 24:00 च्या आसपास) मंद/जलद घड्याळाशी जुळू शकते, हे विशिष्ट प्रश्नांत तपासावे / A correct clock may coincide with a fast/slow clock's display at specific points during checking problems.

## दिनदर्शिका मूलभूत तत्त्वे / Calendar — Basic Principles
- ग्रेगोरियन दिनदर्शिका (Gregorian Calendar) ही आजची प्रमाण दिनदर्शिका असून ती इ.स. 1582 मध्ये पोप ग्रेगरी तेरावा यांनी सुरू केली / The Gregorian calendar, the standard calendar used today, was introduced by Pope Gregory XIII in 1582 AD.
- सामान्य वर्षात (Ordinary Year) 365 दिवस असतात, तर लीप वर्षात (Leap Year) 366 दिवस असतात / An ordinary year has 365 days; a leap year has 366 days.
- 365 दिवस = 52 आठवडे + 1 दिवस, म्हणजे सामान्य वर्ष 1 विषम दिवस (Odd Day) पुढे सरकते / 365 days = 52 weeks + 1 day, so an ordinary year contributes 1 odd day.
- 366 दिवस = 52 आठवडे + 2 दिवस, म्हणजे लीप वर्ष 2 विषम दिवस (Odd Days) पुढे सरकते / 366 days = 52 weeks + 2 days, so a leap year contributes 2 odd days.
- विषम दिवस (Odd Days) म्हणजे पूर्ण आठवडे वजा केल्यानंतर उरलेले दिवस, जे वार काढण्यासाठी वापरले जातात / Odd days are the days left after removing complete weeks; used to calculate the day of the week.

## लीप वर्ष ओळखण्याचे नियम / Rules to Identify a Leap Year
- जे वर्ष 4 ने पूर्ण भाग जाते ते साधारणपणे लीप वर्ष असते (उदा. 2016, 2020, 2024) / A year divisible by 4 is generally a leap year (e.g., 2016, 2020, 2024).
- परंतु जे शतक वर्ष (उदा. 1700, 1800, 1900) असते ते 400 ने पूर्ण भाग गेले तरच लीप वर्ष ठरते / However, a century year (e.g., 1700, 1800, 1900) is a leap year only if divisible by 400.
- उदा. 1600 आणि 2000 ही लीप वर्षे आहेत (400 ने विभाज्य), पण 1700, 1800, 1900 ही लीप वर्षे नाहीत / e.g., 1600 and 2000 are leap years (divisible by 400), but 1700, 1800, 1900 are not.
- लीप वर्षात फेब्रुवारी महिन्यात 29 दिवस असतात, इतर वर्षी 28 दिवस असतात / In a leap year, February has 29 days; otherwise 28 days.
- 2026 हे सामान्य वर्ष आहे (2024 नंतरचे पुढील लीप वर्ष 2028 असेल) / 2026 is an ordinary (non-leap) year; the next leap year after 2024 will be 2028.

## शतकातील विषम दिवस / Odd Days in a Century
- 100 वर्षांत (1 शतक) = 76 सामान्य वर्षे + 24 लीप वर्षे = 76×1 + 24×2 = 76+48 = 124 विषम दिवस; 124÷7 = 17 आठवडे + 5 विषम दिवस, म्हणजे 100 वर्षांचे विषम दिवस = 5 / 100 years contain 76 ordinary + 24 leap years = 76+48 = 124 odd days; 124÷7 leaves remainder 5, so odd days for 100 years = 5.
- 200 वर्षांचे विषम दिवस = 5×2 = 10 → 10 mod 7 = 3 विषम दिवस / Odd days for 200 years = 5×2=10 → mod 7 = 3.
- 300 वर्षांचे विषम दिवस = 5×3 = 15 → 15 mod 7 = 1 विषम दिवस / Odd days for 300 years = 5×3=15 → mod 7 = 1.
- 400 वर्षांचे विषम दिवस = (5×4 + 1[अतिरिक्त लीप वर्षामुळे]) mod 7 = 0 विषम दिवस (कारण 400 वे वर्ष लीप असते) / Odd days for 400 years = 0 (since the 400th year itself is a leap year, giving an extra odd day that makes total divisible by 7).
- म्हणून प्रत्येक 400 वर्षांनी दिनदर्शिका (वार क्रम) पुनरावृत्ती होते / Hence the calendar (day sequence) repeats every 400 years.

## महिन्यांचे विषम दिवस / Odd Days for Each Month
- जानेवारी = 31 दिवस → 3 विषम दिवस / January = 31 days → 3 odd days.
- फेब्रुवारी (सामान्य) = 28 दिवस → 0 विषम दिवस; फेब्रुवारी (लीप) = 29 दिवस → 1 विषम दिवस / February (ordinary) = 28 days → 0 odd days; February (leap) = 29 days → 1 odd day.
- मार्च = 31 → 3, एप्रिल = 30 → 2, मे = 31 → 3, जून = 30 → 2 / March=31→3, April=30→2, May=31→3, June=30→2.
- जुलै = 31 → 3, ऑगस्ट = 31 → 3, सप्टेंबर = 30 → 2, ऑक्टोबर = 31 → 3 / July=31→3, August=31→3, September=30→2, October=31→3.
- नोव्हेंबर = 30 → 2, डिसेंबर = 31 → 3 / November=30→2, December=31→3.
- लक्षात ठेवण्याची पद्धत: 30 दिवसांच्या महिन्याचे विषम दिवस 2, 31 दिवसांच्या महिन्याचे विषम दिवस 3 (फेब्रुवारी वगळता) / Trick: months with 30 days give 2 odd days, months with 31 days give 3 odd days (except February).

## विषम दिवस व वार यांचा संबंध (संदर्भ सारणी) / Reference Table — Odd Days to Day
- 0 विषम दिवस = रविवार (Sunday) / 0 odd days = Sunday.
- 1 विषम दिवस = सोमवार (Monday) / 1 odd day = Monday.
- 2 विषम दिवस = मंगळवार (Tuesday) / 2 odd days = Tuesday.
- 3 विषम दिवस = बुधवार (Wednesday) / 3 odd days = Wednesday.
- 4 विषम दिवस = गुरुवार (Thursday) / 4 odd days = Thursday.
- 5 विषम दिवस = शुक्रवार (Friday) / 5 odd days = Friday.
- 6 विषम दिवस = शनिवार (Saturday) / 6 odd days = Saturday.
- ही सारणी लक्षात ठेवल्यास कोणत्याही तारखेचा वार काढणे सोपे जाते (0=रविवार हा संदर्भ बिंदू धरून) / Memorizing this table (with 0=Sunday as reference) makes finding the day for any date easy.

## वार काढण्याची कार्यपद्धती (संपूर्ण उदाहरणासह) / Method to Find the Day of a Given Date
- पायरी 1: दिलेल्या तारखेपर्यंतची पूर्ण झालेली शतके, वर्षे आणि महिने वेगळे करा / Step 1: Separate complete centuries, years, and months up to the given date.
- पायरी 2: प्रत्येक भागाचे विषम दिवस काढा (शतकांचे, उर्वरित वर्षांचे [सामान्य/लीप स्वतंत्रपणे], चालू महिन्यापर्यंतच्या पूर्ण महिन्यांचे, व चालू महिन्यातील दिवस) / Step 2: Find odd days for each part (centuries, remaining years accounting leap years, completed months of current year, and days in current month).
- पायरी 3: सर्व विषम दिवसांची बेरीज करून 7 ने भागा; बाकी (Remainder) आलेला अंक वरील सारणीत टाकून वार मिळवा / Step 3: Sum all odd days, divide by 7; use the remainder in the reference table to get the day.
- उदाहरण: 15 ऑगस्ट 1947 (भारतीय स्वातंत्र्य दिन) चा वार शुक्रवार होता — हे प्रसिद्ध ऐतिहासिक उदाहरण परीक्षेत विचारले जाते / Example: 15 August 1947 (Indian Independence Day) was a Friday — a famous historical example often asked in exams.
- उदाहरण: 26 जानेवारी 1950 (भारतीय प्रजासत्ताक दिन) चा वार गुरुवार होता / Example: 26 January 1950 (Indian Republic Day) was a Thursday.
- संदर्भ वर्ष म्हणून वापरण्यासाठी: 1 जानेवारी 1 ई.स. हा सोमवार होता असे गृहीत धरून गणना सुरू होते (ग्रेगोरियन विस्तारित पद्धतीनुसार) / As a base reference: calculations often start assuming 1 January, 1 AD was a Monday (per extended Gregorian counting).

## जुळणारी वर्षे (Reference/Repeating Years) / Repeating Calendar Years
- एखाद्या सामान्य वर्षाची दिनदर्शिका पुढील सामान्य वर्षाशी जुळण्यासाठी त्यामध्ये एकूण विषम दिवसांची बेरीज 7 च्या पटीत असावी लागते / For a non-leap year's calendar to repeat, the sum of odd days between the years must be a multiple of 7.
- सर्वसाधारण नियम: जर दोन सामान्य वर्षांच्या मधल्या कालावधीत लीप वर्षांची संख्या मोजून एकूण विषम दिवस 0 (7 चा पट) येत असतील तर त्या दोन वर्षांच्या दिनदर्शिका सारख्या असतात / General rule: if the total odd days between two years (accounting leap years in between) equals a multiple of 7, both years share the same calendar.
- उदाहरण: सामान्यतः 6 किंवा 11 वर्षांनंतर (लीप वर्षांच्या संख्येनुसार) दिनदर्शिका पुनरावृत्ती होते / Example: calendars typically repeat after 6 or 11 years depending on the number of leap years in between.
- 2015 आणि 2026 या दोन्ही वर्षांची दिनदर्शिका सारखी आहे (दोन्ही 1 जानेवारीला गुरुवार) हे तपासून बघता येते / 2015 and 2026 share the same calendar (both start with Thursday on 1 January) — verifiable by calculation.

## विशेष लक्षवेधी मुद्दे / Special Noteworthy Points
- कोणत्याही वर्षाच्या शेवटच्या दिवसाचा (31 डिसेंबर) वार हा त्याच वर्षाच्या नव्या वर्षाच्या मागील गणनेशी जोडलेला असतो, त्यामुळे 1 जानेवारी ते 31 डिसेंबर मधील एकूण विषम दिवस मोजून पुढील वर्षाची सुरुवात काढता येते / Total odd days from 1 January to 31 December help determine the starting day of the next year.
- एकाच महिन्यातील एकाच वाराच्या तारखा नेहमी 7 च्या पटीत अंतराने येतात (उदा. महिन्याचा पहिला सोमवार माहीत असल्यास पुढील सर्व सोमवार 7, 14, 21, 28 जोडून मिळतात) / Dates of the same weekday within a month are always 7 days apart.
- कोणत्याही महिन्यात जास्तीत जास्त एकाच वाराच्या 5 तारखा येऊ शकतात (महिन्यात 31 दिवस असल्यास) / A month can have a maximum of 5 occurrences of a particular weekday if it has 31 days.
- शतकातील ठराविक तारखांचे वार लक्षात ठेवण्यासाठी "Doomsday Rule" सारख्या शॉर्टकट पद्धतीदेखील वापरल्या जातात, जरी त्या MPSC अभ्यासक्रमात औपचारिकपणे नमूद नाहीत / Shortcut methods like the "Doomsday Rule" are sometimes used, though not formally part of the MPSC syllabus.
- वर्षातील कोणताही महिना घेतल्यास, त्याच वर्षातील ठराविक जोड्यांचे महिने एकाच वारापासून सुरू होतात (उदा. सामान्य वर्षात एप्रिल आणि जुलै एकाच वारापासून सुरू होतात) — असे नमुने प्रश्न सोडवण्यास मदत करतात / Certain month-pairs in a year start on the same weekday (e.g., in an ordinary year, April and July start on the same day) — useful patterns for solving problems quickly.

## लक्षात ठेवा / Key Points to Remember
- कोन सूत्र नेहमी लक्षात ठेवा: |30H - (11/2)M|, आणि उत्तर 180° पेक्षा जास्त आल्यास 360° मधून वजा करा / Always remember: Angle = |30H − (11/2)M|; subtract from 360° if the result exceeds 180°.
- 12 तासांत काटे 11 वेळा एकत्र, 11 वेळा 180°, 22 वेळा 90° होतात; 24 तासांत ही संख्या अनुक्रमे दुप्पट (22, 22, 44) होते / In 12 hrs: 11 coincidences, 11 straight-line (180°), 22 right-angles (90°); double these for 24 hrs (22, 22, 44).
- सामान्य वर्ष = 1 विषम दिवस, लीप वर्ष = 2 विषम दिवस / Ordinary year = 1 odd day, Leap year = 2 odd days.
- लीप वर्षाचा नियम: 4 ने विभाज्य पण शतक वर्ष असल्यास 400 ने विभाज्य असणे आवश्यक / Leap year rule: divisible by 4, but century years must be divisible by 400.
- विषम दिवस सारणी पाठ करा: 0=रवि, 1=सोम, 2=मंगळ, 3=बुध, 4=गुरु, 5=शुक्र, 6=शनि / Memorize: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.
- 400 वर्षांनी दिनदर्शिका स्वतःची पुनरावृत्ती करते (400 वर्षांचे विषम दिवस = 0) / Calendar repeats every 400 years (odd days for 400 years = 0).
- आरसा प्रतिमेचे सूत्र (11:60 - वेळ) आणि पाणी प्रतिमेचे सूत्र (17:60 - वेळ, 12-तासी रूपात) यातील फरक स्पष्ट लक्षात ठेवा / Clearly remember the difference: Mirror image = 11:60 − time; Water image = 17:60 − time (in 12-hr form).
- 15 ऑगस्ट 1947 = शुक्रवार, 26 जानेवारी 1950 = गुरुवार ही ऐतिहासिक उदाहरणे पाठ करा — सराव प्रश्नांत हमखास उपयोगी / Memorize: 15 Aug 1947 = Friday, 26 Jan 1950 = Thursday — commonly useful in practice questions.
- सराव करताना युनिटरी पद्धत (Unitary Method) वापरून जलद/मंद घड्याळाचे प्रश्न सोडवावेत / Use the unitary method to solve fast/slow clock problems.
