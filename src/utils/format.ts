export const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '฿0.00';
    try {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        return '฿0.00';
    }
};

const THAI_TIME_ZONE = 'Asia/Bangkok';

const getThaiDateParts = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: THAI_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        hourCycle: 'h23',
    }).formatToParts(date);

    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value || '';

    return {
        day: getPart('day'),
        month: getPart('month'),
        year: getPart('year'),
        hour: getPart('hour'),
        minute: getPart('minute'),
    };
};

export const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const { day, month, year, hour, minute } = getThaiDateParts(date);

        return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch {
        return dateString;
    }
};

export const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const { hour, minute } = getThaiDateParts(date);
        return `${hour}:${minute}`;
    } catch {
        return dateString;
    }
};

export const getThaiDateKey = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const { day, month, year } = getThaiDateParts(date);
    return `${year}-${month}-${day}`;
};

export const formatThaiShortWeekday = (date: Date) =>
    new Intl.DateTimeFormat('th-TH', { timeZone: THAI_TIME_ZONE, weekday: 'short' }).format(date);

export const formatThaiShortDate = (date: Date) =>
    new Intl.DateTimeFormat('th-TH', { timeZone: THAI_TIME_ZONE, day: 'numeric', month: 'short' }).format(date);

export const toThaiDateTimeLocalValue = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const { day, month, year, hour, minute } = getThaiDateParts(date);
    return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const fromThaiDateTimeLocalValue = (value: string) => {
    if (!value) return new Date().toISOString();

    const [datePart, timePart = '00:00'] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) {
        return new Date().toISOString();
    }

    return new Date(Date.UTC(year, month - 1, day, hour - 7, minute)).toISOString();
};
