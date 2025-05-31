const fs = require('fs');
const path = require('path');

// import functions to be tested
const { verifyRecord, formatAndVerifyRecords, sortRecords } = require('../HW2');

describe('Record Verification', () => {
  it('should verify a valid record without errors', () => {
    const validRecord = {
      IDENTIFIER: 'Record1',
      TIME: '2023-01-15T10:30:00',
      WEIGHT: '50',
      UNITS: 'kg',
      COLOR: 'Blue',
    };
    expect(() => verifyRecord(validRecord)).not.toThrow();
  });

  it('should throw an error for a record with missing required property', () => {
    const invalidRecord = {
      IDENTIFIER: 'Record2',
      // missing TIME property
      WEIGHT: '60',
      UNITS: 'lbs',
      COLOR: 'Red',
    };
    expect(() => verifyRecord(invalidRecord)).toThrowError('ERROR: missing property: TIME');
  });
});

describe('Record Formatting and Validation', () => {
  it('should format and validate records without errors', () => {
    const validData = `
      BEGIN:RECORD
      IDENTIFIER: Record1
      TIME: 2023-01-15T10:30:00
      WEIGHT: 50
      UNITS: kg
      COLOR: Blue
      END:RECORD

      BEGIN:RECORD
      IDENTIFIER: Record2
      TIME: 2023-01-14T09:45:00
      WEIGHT: 60
      UNITS: lbs
      COLOR: Red
      END:RECORD
    `;
    expect(() => formatAndVerifyRecords(validData)).not.toThrow();
  });

  it('should throw an error for nested records', () => {
    const invalidData = `
      BEGIN:RECORD
      IDENTIFIER: Record1
      TIME: 2023-01-15T10:30:00
      BEGIN:RECORD
      IDENTIFIER: NestedRecord
      TIME: 2023-01-15T11:30:00
      END:RECORD
      END:RECORD
    `;
    expect(() => formatAndVerifyRecords(invalidData)).toThrowError('ERROR: nested records are not allowed');
  });
});

describe('Record Sorting', () => {
  it('should sort records by TIME in ascending order', () => {
    const unsortedRecords = [
      { IDENTIFIER: 'Record2', TIME: '2023-01-14T09:45:00' },
      { IDENTIFIER: 'Record1', TIME: '2023-01-15T10:30:00' },
    ];
    const sortedRecords = sortRecords(unsortedRecords);
    expect(sortedRecords[0].TIME).toBe('2023-01-14T09:45:00');
    expect(sortedRecords[1].TIME).toBe('2023-01-15T10:30:00');
  });
});

