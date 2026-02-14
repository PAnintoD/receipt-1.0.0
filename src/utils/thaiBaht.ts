/**
 * Converts a number to Thai Baht text.
 * Example: 121.50 -> หนึ่งร้อยยี่สิบเอ็ดบาทห้าสิบสตางค์
 */
export const thaiBahtText = (amount: number): string => {
    if (isNaN(amount) || amount === null) return '';

    amount = Number(amount.toFixed(2));
    const baht = Math.floor(amount);
    const satang = Math.round((amount - baht) * 100);

    if (baht === 0 && satang === 0) return 'ศูนย์บาทถ้วน';

    const numberText = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const digitText = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    const convert = (n: number): string => {
        let text = '';
        const s = n.toString();

        for (let i = 0; i < s.length; i++) {
            const digit = parseInt(s[i]);
            const pos = s.length - i - 1;

            if (digit === 0) continue;

            if (pos === 1 && digit === 1) {
                text += ''; // Don't say "Nueng Sip", just "Sip"
            } else if (pos === 1 && digit === 2) {
                text += 'ยี่';
            } else if (pos === 0 && digit === 1 && s.length > 1) {
                text += 'เอ็ด';
            } else {
                text += numberText[digit];
            }

            text += digitText[pos];
        }

        if (text === '') return ''; // If all zeros

        // Fix "Sip" for 10, 11, etc.
        // If the number starts with 1 in the tens place, the loop above added nothing for the digit, just the position "Sip"
        // Wait, loop: digit 1, pos 1 -> empty text, then adds "Sip". Correct.
        // But for 10: digit 1, pos 1 -> "Sip", digit 0 pos 0 -> continue. "Sip". Correct.
        // For 11: digit 1, pos 1 -> "Sip", digit 1 pos 0 -> "Et". "Sip Et". Correct.

        return text;
    };

    // Handle millions
    let text = '';
    if (baht > 999999) {
        const millions = Math.floor(baht / 1000000);
        const remainder = baht % 1000000;
        text += convert(millions) + 'ล้าน';
        if (remainder > 0) {
            text += convert(remainder);
        }
    } else {
        text += convert(baht);
    }

    text += 'บาท';

    if (satang === 0) {
        text += 'ถ้วน';
    } else {
        text += convert(satang) + 'สตางค์';
    }

    return text;
};
