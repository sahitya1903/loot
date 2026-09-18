import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('updates the value after the delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        expect(result.current).toBe('initial');

        // Update the value
        rerender({ value: 'updated', delay: 500 });

        // Value should not change yet
        expect(result.current).toBe('initial');

        // Fast forward time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Now value should be updated
        expect(result.current).toBe('updated');
    });

    it('resets the timer on rapid updates', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'update1', delay: 500 });
        act(() => {
            vi.advanceTimersByTime(300);
        });

        // Update again before delay completes
        rerender({ value: 'update2', delay: 500 });
        act(() => {
            vi.advanceTimersByTime(300);
        });

        // Should still be initial because timer was reset
        expect(result.current).toBe('initial');

        // Wait for full delay
        act(() => {
            vi.advanceTimersByTime(200);
        });

        // Now should be the latest value
        expect(result.current).toBe('update2');
    });

    it('handles different delay values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 1000 } }
        );

        rerender({ value: 'updated', delay: 1000 });

        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current).toBe('initial');

        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current).toBe('updated');
    });

    it('works with objects', () => {
        const obj1 = { name: 'test' };
        const obj2 = { name: 'updated' };

        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: obj1, delay: 500 } }
        );

        expect(result.current).toBe(obj1);

        rerender({ value: obj2, delay: 500 });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe(obj2);
    });
});
