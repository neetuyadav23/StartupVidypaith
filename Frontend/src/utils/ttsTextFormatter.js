// File: src/utils/ttsTextFormatter.js

export class TTSTextFormatter {
  
  // Helper: Escape regex special characters
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // Format text with smart pronunciation hints
  static formatForTTS(text, language = 'en-US') {
    if (!text) return '';
    
    let formatted = text;
    
    // First, translate if needed (basic translation for demo)
    formatted = this.translateText(formatted, language);
    
    // Step 1: Handle dates in the target language
    formatted = this.formatDates(formatted, language);
    
    // Step 2: Handle technical terms/acronyms
    formatted = this.formatTechnicalTerms(formatted, language);
    
    // Step 3: Handle abbreviations
    formatted = this.formatAbbreviations(formatted);
    
    // Step 4: Handle special characters
    formatted = this.formatSpecialCharacters(formatted);
    
    // Step 5: Add pauses for readability (remove [pause] tags)
    formatted = this.addSpeechPauses(formatted, language);
    
    return formatted;
  }
  
  // Basic translation function (for demo - in production use a translation API)
  static translateText(text, language) {
    const langCode = language.split('-')[0];
    
    // Basic translation dictionary (extend as needed)
    const translations = {
      'en': {
        'Event:': 'Event:',
        'Description:': 'Description:',
        'Date:': 'Date:',
        'Time:': 'Time:',
        'Location:': 'Location:',
        'Organized by:': 'Organized by:',
        'Category:': 'Category:',
        'Tags:': 'Tags:',
        'Registration:': 'Registration:',
        'Online event': 'Online event',
        'Registration link is available': 'Registration link is available',
        'Maximum participants:': 'Maximum participants:',
        'Big Hackathon': 'Big Hackathon',
        'Hiring': 'Hiring',
        'Workshop': 'Workshop',
        'Conference': 'Conference',
        'Webinar': 'Webinar'
      },
      'hi': {
        'Event:': 'कार्यक्रम:',
        'Description:': 'विवरण:',
        'Date:': 'तारीख:',
        'Time:': 'समय:',
        'Location:': 'स्थान:',
        'Organized by:': 'आयोजक:',
        'Category:': 'श्रेणी:',
        'Tags:': 'टैग:',
        'Registration:': 'पंजीकरण:',
        'Online event': 'ऑनलाइन कार्यक्रम',
        'Registration link is available': 'पंजीकरण लिंक उपलब्ध है',
        'Maximum participants:': 'अधिकतम प्रतिभागी:',
        'Big Hackathon': 'बड़ा हैकाथॉन',
        'Hiring': 'भर्ती',
        'Workshop': 'कार्यशाला',
        'Conference': 'सम्मेलन',
        'Webinar': 'वेबिनार'
      },
      'es': {
        'Event:': 'Evento:',
        'Description:': 'Descripción:',
        'Date:': 'Fecha:',
        'Time:': 'Hora:',
        'Location:': 'Ubicación:',
        'Organized by:': 'Organizado por:',
        'Category:': 'Categoría:',
        'Tags:': 'Etiquetas:',
        'Registration:': 'Registro:',
        'Online event': 'Evento en línea',
        'Registration link is available': 'El enlace de registro está disponible',
        'Maximum participants:': 'Máximo de participantes:',
        'Big Hackathon': 'Gran Hackathon',
        'Hiring': 'Contratación',
        'Workshop': 'Taller',
        'Conference': 'Conferencia',
        'Webinar': 'Seminario web'
      }
    };
    
    let result = text;
    const translationDict = translations[langCode] || translations['en'];
    
    // Translate common phrases
    Object.keys(translationDict).forEach(key => {
      const escapedKey = this.escapeRegExp(key);
      const regex = new RegExp(escapedKey, 'gi');
      result = result.replace(regex, translationDict[key]);
    });
    
    return result;
  }
  
  // Format dates to be spoken naturally
  static formatDates(text, language) {
    const datePatterns = [
      // Pattern: "2024-03-15"
      {
        regex: /(\d{4})-(\d{1,2})-(\d{1,2})/g,
        replace: (match, year, month, day) => {
          return this.speakDate(year, month, day, language);
        }
      },
      // Pattern: "March 15, 2024"
      {
        regex: /(\w+)\s+(\d{1,2}),\s*(\d{4})/gi,
        replace: (match, month, day, year) => {
          return this.speakDate(year, this.monthToNumber(month), day, language);
        }
      },
      // Pattern: "15 March 2024"
      {
        regex: /(\d{1,2})\s+(\w+)\s+(\d{4})/gi,
        replace: (match, day, month, year) => {
          return this.speakDate(year, this.monthToNumber(month), day, language);
        }
      }
    ];
    
    let result = text;
    datePatterns.forEach(pattern => {
      result = result.replace(pattern.regex, pattern.replace);
    });
    
    return result;
  }
  
  // Speak date in natural language
  static speakDate(year, month, day, language) {
    const date = new Date(year, month - 1, day);
    
    if (language.startsWith('en')) {
      // English: "March fifteenth, twenty twenty-four"
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const dayNum = parseInt(day);
      const daySuffix = this.getDaySuffix(dayNum);
      const yearWords = this.numberToWords(year);
      
      return `${monthName} ${dayNum}${daySuffix}, ${yearWords}`;
    }
    
    if (language.startsWith('hi')) {
      // Hindi: "पंद्रह मार्च दो हज़ार चौबीस"
      const monthsHindi = [
        'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
      ];
      const monthName = monthsHindi[month - 1];
      const dayHindi = this.numberToHindiWords(parseInt(day));
      const yearHindi = this.numberToHindiWords(parseInt(year));
      
      return `${dayHindi} ${monthName} ${yearHindi}`;
    }
    
    if (language.startsWith('es')) {
      // Spanish: "quince de marzo de dos mil veinticuatro"
      const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
      const daySpanish = this.numberToSpanishWords(parseInt(day));
      const yearSpanish = this.numberToSpanishWords(parseInt(year));
      
      return `${daySpanish} de ${monthName} de ${yearSpanish}`;
    }
    
    // Default: Use locale-specific format
    return date.toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Format technical terms for better pronunciation
  static formatTechnicalTerms(text, language) {
    const techTerms = {
      // English technical terms
      'en': {
        'Devops': 'Dev Ops',
        'DevOps': 'Dev Ops',
        'AWS': 'A W S',
        'API': 'A P I',
        'AI': 'A I',
        'ML': 'Machine Learning',
        'Kubernetes': 'Koo-ber-net-eez',
        'Docker': 'Docker',
        'React': 'React',
        'Node.js': 'Node J S',
        'JavaScript': 'JavaScript',
        'Python': 'Python',
        'Java': 'Java',
        'C\\+\\+': 'C plus plus',
        'GitHub': 'Git Hub',
        'Azure': 'Azure',
        'GCP': 'G C P',
        'CI/CD': 'C I C D',
        'Microservices': 'Micro services',
        'Blockchain': 'Block chain',
        'IoT': 'I O T',
        'AR/VR': 'A R V R',
        'SaaS': 'Sass',
        'PaaS': 'Pass',
        'IaaS': 'I ass'
      },
      // Hindi technical terms
      'hi': {
        'Devops': 'डेव ऑप्स',
        'DevOps': 'डेव ऑप्स',
        'AWS': 'ए डब्ल्यू एस',
        'API': 'ए पी आई',
        'AI': 'कृत्रिम बुद्धिमत्ता',
        'ML': 'मशीन लर्निंग',
        'JavaScript': 'जावास्क्रिप्ट',
        'Python': 'पाइथन',
        'React': 'रिएक्ट',
        'Node.js': 'नोड जे एस',
        'GitHub': 'गिटहब',
        'C\\+\\+': 'सी प्लस प्लस'
      },
      // Spanish technical terms
      'es': {
        'Devops': 'Dev Ops',
        'DevOps': 'Dev Ops',
        'AWS': 'A W S',
        'API': 'A P I',
        'AI': 'Inteligencia Artificial',
        'ML': 'Aprendizaje Automático',
        'JavaScript': 'JavaScript',
        'Python': 'Python',
        'React': 'React',
        'C\\+\\+': 'C más más'
      }
    };
    
    const langCode = language.split('-')[0];
    const terms = techTerms[langCode] || techTerms['en'];
    
    let result = text;
    
    // Sort by length (longest first) to avoid partial replacements
    const sortedTerms = Object.keys(terms).sort((a, b) => b.length - a.length);
    
    sortedTerms.forEach(term => {
      // Escape special regex characters in the term
      const escapedTerm = this.escapeRegExp(term);
      const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
      result = result.replace(regex, terms[term]);
    });
    
    return result;
  }
  
  // Format abbreviations
  static formatAbbreviations(text) {
    const abbreviations = {
      'e\\.g\\.': 'for example',
      'i\\.e\\.': 'that is',
      'etc\\.': 'and so on',
      'vs\\.': 'versus',
      'approx\\.': 'approximately',
      'max\\.': 'maximum',
      'min\\.': 'minimum',
      'no\\.': 'number',
      'Dr\\.': 'Doctor',
      'Mr\\.': 'Mister',
      'Mrs\\.': 'Misses',
      'Prof\\.': 'Professor'
    };
    
    let result = text;
    
    Object.keys(abbreviations).forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      result = result.replace(regex, abbreviations[abbr]);
    });
    
    return result;
  }
  
  // Handle special characters
  static formatSpecialCharacters(text) {
    let result = text;
    
    // Replace symbols with words
    const symbolMap = {
      '@': ' at ',
      '#': ' hash ',
      '$': ' dollar ',
      '%': ' percent ',
      '&': ' and ',
      '\\+': ' plus ',
      '-': ' minus ',
      '=': ' equals ',
      '/': ' slash ',
      '|': ' pipe ',
      '_': ' underscore ',
      '\\(': ' open parenthesis ',
      '\\)': ' close parenthesis ',
      '<': ' less than ',
      '>': ' greater than ',
      '₹': ' rupees ',
      '€': ' euros ',
      '£': ' pounds '
    };
    
    Object.keys(symbolMap).forEach(symbol => {
      const escapedSymbol = this.escapeRegExp(symbol);
      result = result.replace(new RegExp(escapedSymbol, 'g'), symbolMap[symbol]);
    });
    
    return result;
  }
  
  // Add natural pauses for better speech (without saying "pause")
  static addSpeechPauses(text, language) {
    let result = text;
    
    // Remove any existing [pause] tags first
    result = result.replace(/\[pause\]/gi, '');
    
    // Add natural pauses with punctuation
    if (language.startsWith('en')) {
      result = result.replace(/(Event:|Description:|Date:|Time:|Location:|Organized by:|Category:|Tags:|Registration:)/gi, '. $1');
    } else if (language.startsWith('hi')) {
      result = result.replace(/(कार्यक्रम:|विवरण:|तारीख:|समय:|स्थान:|आयोजक:|श्रेणी:|टैग:|पंजीकरण:)/gi, '. $1');
    } else if (language.startsWith('es')) {
      result = result.replace(/(Evento:|Descripción:|Fecha:|Hora:|Ubicación:|Organizado por:|Categoría:|Etiquetas:|Registro:)/gi, '. $1');
    }
    
    // Ensure sentences end with periods
    result = result.replace(/([^.!?])\s*$/g, '$1.');
    
    // Remove multiple periods
    result = result.replace(/\.{2,}/g, '.');
    
    return result;
  }
  
  // Helper: Convert month name to number
  static monthToNumber(monthName) {
    const months = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12,
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
      'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9,
      'oct': 10, 'nov': 11, 'dec': 12
    };
    
    return months[monthName.toLowerCase()] || 1;
  }
  
  // Helper: Get day suffix (1st, 2nd, 3rd, 4th)
  static getDaySuffix(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  
  // Helper: Convert number to words (English) - Fixed for 2026
  static numberToWords(num) {
    if (typeof num !== 'number') {
      num = parseInt(num);
      if (isNaN(num)) return num.toString();
    }
    
    if (num < 0 || num > 9999) {
      // For numbers > 9999, read digit by digit
      return num.toString().split('').map(d => {
        if (d === '0') return 'zero';
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        return ones[parseInt(d)] || d;
      }).join(' ');
    }
    
    if (num === 0) return 'zero';
    
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const thousands = ['', 'thousand'];
    
    let words = '';
    let n = num;
    
    // Thousands
    if (n >= 1000) {
      const thousand = Math.floor(n / 1000);
      words += ones[thousand] + ' thousand ';
      n %= 1000;
    }
    
    // Hundreds
    if (n >= 100) {
      const hundred = Math.floor(n / 100);
      words += ones[hundred] + ' hundred ';
      n %= 100;
      
      if (n > 0) words += 'and ';
    }
    
    // Tens and ones
    if (n > 0) {
      if (n < 10) {
        words += ones[n];
      } else if (n < 20) {
        words += teens[n - 10];
      } else {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        words += tens[ten];
        if (one > 0) {
          words += '-' + ones[one];
        }
      }
    }
    
    return words.trim();
  }
  
  // Helper: Convert number to Hindi words - Fixed for 2026
  static numberToHindiWords(num) {
    if (typeof num !== 'number') {
      num = parseInt(num);
      if (isNaN(num)) return num.toString();
    }
    
    if (num > 9999) {
      // For numbers > 9999, read digit by digit in Hindi
      const hindiDigits = ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ'];
      return num.toString().split('').map(d => {
        return hindiDigits[parseInt(d)] || d;
      }).join(' ');
    }
    
    if (num === 0) return 'शून्य';
    
    const hindiOnes = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ'];
    const hindiTeens = ['दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस'];
    const hindiTens = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];
    const hindiHundreds = ['', 'सौ'];
    
    let words = '';
    let n = num;
    
    // Thousands
    if (n >= 1000) {
      const thousand = Math.floor(n / 1000);
      if (thousand === 1) {
        words += 'एक हज़ार ';
      } else {
        words += hindiOnes[thousand] + ' हज़ार ';
      }
      n %= 1000;
    }
    
    // Hundreds
    if (n >= 100) {
      const hundred = Math.floor(n / 100);
      if (hundred === 1) {
        words += 'सौ ';
      } else {
        words += hindiOnes[hundred] + ' सौ ';
      }
      n %= 100;
    }
    
    // Tens and ones
    if (n > 0) {
      if (n < 10) {
        words += hindiOnes[n];
      } else if (n < 20) {
        words += hindiTeens[n - 10];
      } else {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        words += hindiTens[ten];
        if (one > 0) {
          words += ' ' + hindiOnes[one];
        }
      }
    }
    
    return words.trim();
  }
  
  // Helper: Convert number to Spanish words - Fixed
  static numberToSpanishWords(num) {
    if (typeof num !== 'number') {
      num = parseInt(num);
      if (isNaN(num)) return num.toString();
    }
    
    if (num > 9999) {
      // For numbers > 9999, read digit by digit in Spanish
      const spanishDigits = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
      return num.toString().split('').map(d => {
        return spanishDigits[parseInt(d)] || d;
      }).join(' ');
    }
    
    if (num === 0) return 'cero';
    
    const spanishOnes = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const spanishTeens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const spanishTens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const spanishHundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 
                             'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    
    let words = '';
    let n = num;
    
    // Thousands
    if (n >= 1000) {
      const thousand = Math.floor(n / 1000);
      if (thousand === 1) {
        words += 'mil ';
      } else {
        words += spanishOnes[thousand] + ' mil ';
      }
      n %= 1000;
    }
    
    // Hundreds
    if (n >= 100) {
      if (n === 100) {
        words += 'cien ';
        n = 0;
      } else {
        const hundred = Math.floor(n / 100);
        words += spanishHundreds[hundred] + ' ';
        n %= 100;
      }
    }
    
    // Tens and ones
    if (n > 0) {
      if (n < 10) {
        words += spanishOnes[n];
      } else if (n < 20) {
        words += spanishTeens[n - 10];
      } else {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        
        if (n === 20) words += 'veinte';
        else if (n === 21) words += 'veintiuno';
        else if (n === 22) words += 'veintidós';
        else if (n === 23) words += 'veintitrés';
        else if (n === 26) words += 'veintiséis';
        else {
          words += spanishTens[ten];
          if (one > 0) {
            words += ' y ' + spanishOnes[one];
          }
        }
      }
    }
    
    return words.trim();
  }
}

export default TTSTextFormatter;