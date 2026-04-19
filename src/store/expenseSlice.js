export const createExpenseSlice = (set, get) => ({
  expenses: [],

  setExpenses: (expenses) => set({ expenses }, false, 'expense/setExpenses'),

  addExpense: (e) =>
    set((s) => ({ expenses: [e, ...s.expenses] }), false, 'expense/addExpense'),

  updateExpense: (id, patch) =>
    set(
      (s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),
      false,
      'expense/updateExpense'
    ),

  softDeleteExpense: (id) =>
    set(
      (s) => ({
        expenses: s.expenses.map((e) => (e.id === id ? { ...e, isDeleted: true } : e)),
      }),
      false,
      'expense/softDeleteExpense'
    ),

  getTotalExpenses: (month) => {
    const { expenses } = get();
    return expenses
      .filter((e) => !e.isDeleted && (!month || (e.date || '').startsWith(month)))
      .reduce((s, e) => s + (e.amount || 0), 0);
  },
});
