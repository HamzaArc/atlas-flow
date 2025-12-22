export interface ComplianceResult {
  code: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  dutyRate: string;
  restrictions: string[];
  isHazmat: boolean;
  requiresTemperature: boolean;
}

// Mock database simulating an AI Knowledge Graph
const KNOWLEDGE_GRAPH: Record<string, ComplianceResult> = {
  "leather shoes": {
    code: "6403.99",
    confidence: "HIGH",
    title: "Footwear with Outer Soles of Rubber/Plastics",
    description: "Includes sports footwear; tennis shoes, basketball shoes, gym shoes, training shoes and the like.",
    dutyRate: "8% - 17%",
    restrictions: [],
    isHazmat: false,
    requiresTemperature: false
  },
  "laptop": {
    code: "8471.30",
    confidence: "HIGH",
    title: "Portable Automatic Data Processing Machines",
    description: "Weighing not more than 10 kg, consisting of at least a central processing unit, a keyboard and a display.",
    dutyRate: "0% (ITA Agreement)",
    restrictions: ["Requires Dual-Use Export License check for encryption."],
    isHazmat: true, // Lithium batteries
    requiresTemperature: false
  },
  "mangoes": {
    code: "0804.50",
    confidence: "HIGH",
    title: "Guavas, Mangoes and Mangosteens",
    description: "Fresh or dried. Strictly regulated for pests.",
    dutyRate: "Free",
    restrictions: ["Phytosanitary Certificate Required", "Origin Labeling Mandatory"],
    isHazmat: false,
    requiresTemperature: true
  },
  "cotton t-shirt": {
    code: "6109.10",
    confidence: "HIGH",
    title: "T-Shirts, Singlets and Other Vests",
    description: "Knitted or crocheted, of cotton.",
    dutyRate: "12% + 0.5 EUR/kg",
    restrictions: [],
    isHazmat: false,
    requiresTemperature: false
  },
  "lithium battery": {
    code: "8507.60",
    confidence: "HIGH",
    title: "Lithium-Ion Accumulators",
    description: "Electrical energy storage. Highly regulated in transport.",
    dutyRate: "2.7%",
    restrictions: ["UN 3480 / UN 3481 Class 9 Hazardous Goods"],
    isHazmat: true,
    requiresTemperature: false
  }
};

export const ComplianceService = {
  /**
   * Simulates an AI analysis of the goods description.
   */
  suggestHSCode: async (description: string): Promise<ComplianceResult | null> => {
    // Simulate network latency for realism
    await new Promise(resolve => setTimeout(resolve, 800));

    const query = description.toLowerCase().trim();
    
    // Fuzzy match logic for demo purposes
    const matchKey = Object.keys(KNOWLEDGE_GRAPH).find(k => query.includes(k));
    
    if (matchKey) {
      return KNOWLEDGE_GRAPH[matchKey];
    }

    // Fallback "AI Guess" for unknown items
    if (query.length > 3) {
      return {
        code: "9999.99",
        confidence: "LOW",
        title: "Unclassified General Cargo",
        description: "The system could not positively identify this commodity. Manual verification is required by a broker.",
        dutyRate: "Unknown",
        restrictions: ["Manual Classification Required"],
        isHazmat: false,
        requiresTemperature: false
      };
    }

    return null;
  }
};