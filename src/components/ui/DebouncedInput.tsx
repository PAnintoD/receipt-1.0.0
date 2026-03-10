import React, { useState, useEffect, useRef } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string | number;
    onChange: (value: string | number) => void;
    debounce?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
    value: initialValue,
    onChange,
    debounce = 300,
    ...props
}) => {
    const [value, setValue] = useState(initialValue);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (onChangeRef.current) {
                onChangeRef.current(value);
            }
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value, debounce]);

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={(e) => {
                if (onChangeRef.current) {
                    onChangeRef.current(value);
                }
                if (props.onBlur) props.onBlur(e);
            }}
        />
    );
};

interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    debounce?: number;
}

export const DebouncedTextarea: React.FC<DebouncedTextareaProps> = ({
    value: initialValue,
    onChange,
    debounce = 300,
    ...props
}) => {
    const [value, setValue] = useState(initialValue);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (onChangeRef.current) {
                onChangeRef.current(value);
            }
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value, debounce]);

    return (
        <textarea
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={(e) => {
                if (onChangeRef.current) {
                    onChangeRef.current(value);
                }
                if (props.onBlur) props.onBlur(e);
            }}
        />
    );
};
