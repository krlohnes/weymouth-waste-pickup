const assert = require('assert');
const { 
    parseAddress, 
    formatDate, 
    getWeekStart, 
    getYardWasteMonday,
    findStreetInfo,
    getWeekDates,
    isDateInWeek,
    isPickupDelayedByHoliday,
    getShiftedPickupDay
} = require('../app.js');

describe('Weymouth Waste Pickup Tests', () => {
    
    describe('parseAddress', () => {
        it('should parse valid addresses', () => {
            const result = parseAddress('123 Main Street');
            assert.strictEqual(result.number, 123);
            assert.strictEqual(result.street, 'MAIN STREET');
        });
        
        it('should return null for invalid addresses', () => {
            assert.strictEqual(parseAddress('Main Street'), null);
            assert.strictEqual(parseAddress(''), null);
            assert.strictEqual(parseAddress('123'), null);
        });
        
        it('should handle extra spaces', () => {
            const result = parseAddress('456   Oak   Avenue  ');
            assert.strictEqual(result.number, 456);
            assert.strictEqual(result.street, 'OAK   AVENUE');
        });
    });
    
    describe('formatDate', () => {
        it('should format dates as YYYY-MM-DD', () => {
            const date = new Date('2025-07-06');
            assert.strictEqual(formatDate(date), '2025-07-06');
        });
        
        it('should handle timezone correctly', () => {
            const date = new Date('2025-07-06T12:00:00');
            assert.strictEqual(formatDate(date).startsWith('2025-07-06'), true);
        });
    });
    
    describe('getWeekStart', () => {
        it('should return Sunday for any day of the week', () => {
            // Sunday
            const sunday = new Date('2025-07-06');
            assert.strictEqual(getWeekStart(sunday).toDateString(), 'Sun Jul 06 2025');
            
            // Monday
            const monday = new Date('2025-07-07');
            assert.strictEqual(getWeekStart(monday).toDateString(), 'Sun Jul 06 2025');
            
            // Saturday
            const saturday = new Date('2025-07-12');
            assert.strictEqual(getWeekStart(saturday).toDateString(), 'Sun Jul 06 2025');
        });
    });
    
    describe('getYardWasteMonday', () => {
        it('should return next Monday when input is Sunday', () => {
            const sunday = new Date('2025-07-06');
            const result = getYardWasteMonday(sunday);
            assert.strictEqual(result.toDateString(), 'Mon Jul 07 2025');
            assert.strictEqual(formatDate(result), '2025-07-07');
        });
        
        it('should return current weeks Monday for Monday', () => {
            const monday = new Date('2025-07-07');
            const result = getYardWasteMonday(monday);
            assert.strictEqual(result.toDateString(), 'Mon Jul 07 2025');
        });
        
        it('should return current weeks Monday for Tuesday-Saturday', () => {
            const tuesday = new Date('2025-07-08');
            const result = getYardWasteMonday(tuesday);
            assert.strictEqual(result.toDateString(), 'Mon Jul 07 2025');
            
            const saturday = new Date('2025-07-12');
            const result2 = getYardWasteMonday(saturday);
            assert.strictEqual(result2.toDateString(), 'Mon Jul 07 2025');
        });
        
        it('should handle month boundaries correctly', () => {
            // Sunday June 29, 2025
            const sunday = new Date('2025-06-29');
            const result = getYardWasteMonday(sunday);
            assert.strictEqual(result.toDateString(), 'Mon Jun 30 2025');
            assert.strictEqual(formatDate(result), '2025-06-30');
        });
        
        it('should handle year boundaries correctly', () => {
            // Sunday December 28, 2025
            const sunday = new Date('2025-12-28');
            const result = getYardWasteMonday(sunday);
            assert.strictEqual(result.toDateString(), 'Mon Dec 29 2025');
        });
    });
    
    describe('getWeekDates', () => {
        it('should return 7 days starting from Sunday', () => {
            const date = new Date('2025-07-08'); // Tuesday
            const week = getWeekDates(date);
            
            assert.strictEqual(week.length, 7);
            assert.strictEqual(week[0].toDateString(), 'Sun Jul 06 2025');
            assert.strictEqual(week[6].toDateString(), 'Sat Jul 12 2025');
        });
    });
    
    describe('isDateInWeek', () => {
        it('should correctly identify if date is in week', () => {
            const week = [
                new Date('2025-07-06'),
                new Date('2025-07-07'),
                new Date('2025-07-08'),
                new Date('2025-07-09'),
                new Date('2025-07-10'),
                new Date('2025-07-11'),
                new Date('2025-07-12')
            ];
            
            assert.strictEqual(isDateInWeek(new Date('2025-07-07'), week), true);
            assert.strictEqual(isDateInWeek(new Date('2025-07-13'), week), false);
            assert.strictEqual(isDateInWeek(new Date('2025-07-05'), week), false);
        });
    });
    
    describe('isPickupDelayedByHoliday', () => {
        it('should not delay pickup for weekend holidays', () => {
            const saturday = new Date('2025-07-05'); // Saturday
            const sunday = new Date('2025-07-06'); // Sunday
            
            assert.strictEqual(isPickupDelayedByHoliday('Monday', saturday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Friday', sunday), false);
        });
        
        it('should delay pickup if pickup is on or after holiday', () => {
            const mondayHoliday = new Date('2025-07-07'); // Monday
            
            // Monday pickup on Monday holiday = delayed
            assert.strictEqual(isPickupDelayedByHoliday('Monday', mondayHoliday), true);
            
            // Tuesday-Friday pickups after Monday holiday = delayed
            assert.strictEqual(isPickupDelayedByHoliday('Tuesday', mondayHoliday), true);
            assert.strictEqual(isPickupDelayedByHoliday('Wednesday', mondayHoliday), true);
            assert.strictEqual(isPickupDelayedByHoliday('Thursday', mondayHoliday), true);
            assert.strictEqual(isPickupDelayedByHoliday('Friday', mondayHoliday), true);
        });
        
        it('should not delay pickup if pickup is before holiday', () => {
            const wednesdayHoliday = new Date('2025-07-09'); // Wednesday
            
            // Monday and Tuesday pickups before Wednesday holiday = not delayed
            assert.strictEqual(isPickupDelayedByHoliday('Monday', wednesdayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Tuesday', wednesdayHoliday), false);
            
            // Wednesday-Friday pickups on/after Wednesday holiday = delayed
            assert.strictEqual(isPickupDelayedByHoliday('Wednesday', wednesdayHoliday), true);
            assert.strictEqual(isPickupDelayedByHoliday('Thursday', wednesdayHoliday), true);
            assert.strictEqual(isPickupDelayedByHoliday('Friday', wednesdayHoliday), true);
        });
        
        it('should handle Friday holidays correctly', () => {
            const fridayHoliday = new Date('2025-07-04'); // Friday
            
            // Only Friday pickup is delayed
            assert.strictEqual(isPickupDelayedByHoliday('Monday', fridayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Tuesday', fridayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Wednesday', fridayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Thursday', fridayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Friday', fridayHoliday), true);
        });
    });
    
    describe('getShiftedPickupDay', () => {
        it('should shift weekdays to the next day', () => {
            assert.strictEqual(getShiftedPickupDay('Monday'), 'Tuesday');
            assert.strictEqual(getShiftedPickupDay('Tuesday'), 'Wednesday');
            assert.strictEqual(getShiftedPickupDay('Wednesday'), 'Thursday');
            assert.strictEqual(getShiftedPickupDay('Thursday'), 'Friday');
        });
        
        it('should handle Friday as a corner case - shifts to Saturday', () => {
            assert.strictEqual(getShiftedPickupDay('Friday'), 'Saturday');
        });
        
        it('should handle weekend wrapping correctly', () => {
            assert.strictEqual(getShiftedPickupDay('Saturday'), 'Sunday');
            assert.strictEqual(getShiftedPickupDay('Sunday'), 'Monday');
        });
    });
    
    describe('Holiday Pickup Day Integration Tests', () => {
        it('should correctly identify shifted pickup days for various scenarios', () => {
            // Monday holiday affecting Tuesday pickup
            const mondayHoliday = new Date('2025-07-07'); // Monday
            assert.strictEqual(isPickupDelayedByHoliday('Tuesday', mondayHoliday), true);
            assert.strictEqual(getShiftedPickupDay('Tuesday'), 'Wednesday');
            
            // Wednesday holiday affecting Friday pickup
            const wednesdayHoliday = new Date('2025-07-09'); // Wednesday
            assert.strictEqual(isPickupDelayedByHoliday('Friday', wednesdayHoliday), true);
            assert.strictEqual(getShiftedPickupDay('Friday'), 'Saturday');
        });
        
        it('should handle the critical Friday → Saturday shift', () => {
            const thursdayHoliday = new Date('2025-07-10'); // Thursday
            
            // Friday pickup delayed by Thursday holiday
            assert.strictEqual(isPickupDelayedByHoliday('Friday', thursdayHoliday), true);
            // This moves Friday pickup to Saturday
            assert.strictEqual(getShiftedPickupDay('Friday'), 'Saturday');
        });
        
        it('should not shift pickup for holidays after pickup day', () => {
            const fridayHoliday = new Date('2025-07-11'); // Friday
            
            // Monday-Thursday pickups before Friday holiday = not delayed
            assert.strictEqual(isPickupDelayedByHoliday('Monday', fridayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Tuesday', fridayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Wednesday', fridayHoliday), false);
            assert.strictEqual(isPickupDelayedByHoliday('Thursday', fridayHoliday), false);
        });
        
        it('should handle same-day holiday and pickup correctly', () => {
            const wednesdayHoliday = new Date('2025-07-09'); // Wednesday
            
            // Wednesday pickup on Wednesday holiday = delayed to Thursday
            assert.strictEqual(isPickupDelayedByHoliday('Wednesday', wednesdayHoliday), true);
            assert.strictEqual(getShiftedPickupDay('Wednesday'), 'Thursday');
        });
    });
});

// Run tests if this file is executed directly
if (require.main === module) {
    const Mocha = require('mocha');
    const mocha = new Mocha();
    mocha.ui('bdd');
    mocha.addFile(__filename);
    mocha.run(failures => {
        process.exit(failures ? 1 : 0);
    });
}