export type SOAPVisit = {
  id: string;
  visitDate: string;

  // S - Subjective - History of present illness
  subjective: {
    illnessName: string;
    illnessStartDate: string;
    notes?: string;
  };

  // O - Objective - Physical examination findings
  objective: {
    age: string;
    weight: string;
    height: string;
    temperature: string;
    cardiacRate: string;
    respiratoryRate: string;
    bloodPressure: string;
    headCircumference: string;
    notes?: string;
  };

  // A - Assessment - Diagnosis
  assessment: string;

  // P - Plan - Patient Management
  plan: string;

  createdAt: string;
  updatedAt: string;
};
