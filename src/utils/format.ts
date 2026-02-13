export const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '฿0.00';
    try {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 2,
        }).format(amount);
    } catch (e) {
        return '฿0.00';
    }
};

export const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        // Use explicit formatting to ensure consistency
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch (e) {
        return dateString;
    }
};
