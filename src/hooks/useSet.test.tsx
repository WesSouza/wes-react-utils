import { act, render, renderHook, screen } from '@testing-library/react';
import { useCallback } from 'react';

import { useSet } from './useSet';

describe('useSet', () => {
  it('operates as a Set', async () => {
    const { result } = renderHook(() => useSet<string>());

    const set = result.current;

    expect(set.size).toBe(0);
    expect([...set.entries()]).toEqual([]);
    expect([...set.keys()]).toEqual([]);
    expect([...set.values()]).toEqual([]);

    act(() => {
      set.add('1');
    });

    expect(set.size).toBe(1);
    expect(set.has('1')).toBe(true);
    expect([...set.entries()]).toEqual([['1', '1']]);
    expect([...set.keys()]).toEqual(['1']);
    expect([...set.values()]).toEqual(['1']);

    act(() => {
      set.add('2');
      set.add('3');
      set.delete('1');
    });

    expect(set.size).toBe(2);
    expect(set.has('1')).toBe(false);
    expect(set.has('2')).toBe(true);
    expect(set.has('3')).toBe(true);
    expect([...set.entries()]).toEqual([
      ['2', '2'],
      ['3', '3'],
    ]);
    expect([...set.keys()]).toEqual(['2', '3']);
    expect([...set.values()]).toEqual(['2', '3']);

    const fn = jest.fn();
    set.forEach(fn);
    expect(fn).toHaveBeenNthCalledWith(1, '2', '2', expect.any(Set));
    expect(fn).toHaveBeenNthCalledWith(2, '3', '3', expect.any(Set));

    act(() => {
      set.clear();
    });
    expect(set.size).toBe(0);
    expect(set.has('2')).toBe(false);
    expect(set.has('3')).toBe(false);
    expect([...set.entries()]).toEqual([]);
    expect([...set.keys()]).toEqual([]);
    expect([...set.values()]).toEqual([]);
  });

  it('initializes with values, resets if initialized values change', async () => {
    const { rerender, result } = renderHook(
      ({
        initialValues,
      }: {
        initialValues?: (() => Iterable<string>) | Iterable<string> | undefined;
      } = {}) => useSet<string>(initialValues),
    );

    const set = result.current;

    expect(set.size).toBe(0);
    expect([...set.values()]).toEqual([]);

    rerender({ initialValues: ['1'] });

    expect(set.size).toBe(1);
    expect([...set.values()]).toEqual(['1']);

    const getInitialValues = jest.fn().mockReturnValue(['2', '3']);
    rerender({ initialValues: getInitialValues });

    expect(set.size).toBe(2);
    expect([...set.values()]).toEqual(['2', '3']);
    expect(getInitialValues).toHaveBeenCalledTimes(1);
  });

  it('rerenders only when values change', async () => {
    const renderCount = jest.fn();

    function Component() {
      const set = useSet<number>();
      const handleAdd = useCallback(() => set.add(set.size), [set]);
      const handleAddDuplicate = useCallback(
        () => set.add(set.size - 1),
        [set],
      );
      const handleDelete = useCallback(() => set.delete(set.size - 1), [set]);
      const handleDeleteNothing = useCallback(
        () => set.delete(set.size + 1),
        [set],
      );
      const handleClear = useCallback(() => set.clear(), [set]);

      renderCount();

      return (
        <>
          <div aria-label="Size">{set.size}</div>
          <button onClick={handleAdd}>Add</button>
          <button onClick={handleAddDuplicate}>Add Duplicate</button>
          <button onClick={handleDelete}>Delete</button>
          <button onClick={handleDeleteNothing}>Delete Nothing</button>
          <button onClick={handleClear}>Clear</button>
        </>
      );
    }

    render(<Component />);
    renderCount.mockClear();
    expect(await screen.findByLabelText('Size')).toHaveTextContent('0');

    const addButton = screen.getByText('Add');
    act(() => {
      addButton.click();
      addButton.click();
      addButton.click();
    });
    expect(renderCount).toHaveBeenCalledTimes(1);
    expect(await screen.findByLabelText('Size')).toHaveTextContent('3');
    renderCount.mockClear();

    const addDuplicateButton = screen.getByText('Add Duplicate');
    act(() => {
      addDuplicateButton.click();
      addDuplicateButton.click();
      addDuplicateButton.click();
    });
    expect(renderCount).toHaveBeenCalledTimes(0);
    expect(await screen.findByLabelText('Size')).toHaveTextContent('3');
    renderCount.mockClear();

    const deleteButton = screen.getByText('Delete');
    act(() => {
      deleteButton.click();
      deleteButton.click();
    });
    expect(renderCount).toHaveBeenCalledTimes(1);
    expect(await screen.findByLabelText('Size')).toHaveTextContent('1');
    renderCount.mockClear();

    const deleteNothingButton = screen.getByText('Delete Nothing');
    act(() => {
      deleteNothingButton.click();
    });
    expect(renderCount).toHaveBeenCalledTimes(0);
    expect(await screen.findByLabelText('Size')).toHaveTextContent('1');
    renderCount.mockClear();

    const clearButton = screen.getByText('Clear');
    act(() => {
      addButton.click();
      addButton.click();
      clearButton.click();
    });
    expect(renderCount).toHaveBeenCalledTimes(1);
    expect(await screen.findByLabelText('Size')).toHaveTextContent('0');
    renderCount.mockClear();
  });
});
