const { calculateEntrySalary } = require('../utils/salaryCalculator');

describe('Salary Calculator', () => {
  describe('calculateEntrySalary', () => {
    it('should calculate salary with single rate', () => {
      const timeEntry = {
        startAt: new Date('2024-01-01T09:00:00Z'),
        endAt: new Date('2024-01-01T17:00:00Z'),
      };

      const rateChanges = [
        {
          hourlyRate: 2000, // $20.00 in cents
          effectiveAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      const result = calculateEntrySalary(timeEntry, rateChanges);

      expect(result.totalCents).toBe(16000); // 8 hours * $20 = $160
      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].durationHours).toBe(8);
    });

    it('should calculate salary with mid-period rate change', () => {
      const timeEntry = {
        startAt: new Date('2024-01-01T09:00:00Z'),
        endAt: new Date('2024-01-01T17:00:00Z'),
      };

      const rateChanges = [
        {
          hourlyRate: 2000, // $20.00
          effectiveAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          hourlyRate: 2500, // $25.00
          effectiveAt: new Date('2024-01-01T13:00:00Z'),
        },
      ];

      const result = calculateEntrySalary(timeEntry, rateChanges);

      // 9am-1pm: 4 hours * $20 = $80
      // 1pm-5pm: 4 hours * $25 = $100
      // Total: $180
      expect(result.totalCents).toBe(18000);
      expect(result.breakdown.length).toBe(2);
    });

    it('should handle multiple rate changes', () => {
      const timeEntry = {
        startAt: new Date('2024-01-01T08:00:00Z'),
        endAt: new Date('2024-01-01T18:00:00Z'),
      };

      const rateChanges = [
        {
          hourlyRate: 2000, // $20.00
          effectiveAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          hourlyRate: 2500, // $25.00
          effectiveAt: new Date('2024-01-01T12:00:00Z'),
        },
        {
          hourlyRate: 3000, // $30.00
          effectiveAt: new Date('2024-01-01T16:00:00Z'),
        },
      ];

      const result = calculateEntrySalary(timeEntry, rateChanges);

      // 8am-12pm: 4 hours * $20 = $80
      // 12pm-4pm: 4 hours * $25 = $100
      // 4pm-6pm: 2 hours * $30 = $60
      // Total: $240
      expect(result.totalCents).toBe(24000);
      expect(result.breakdown.length).toBe(3);
    });
  });
});

