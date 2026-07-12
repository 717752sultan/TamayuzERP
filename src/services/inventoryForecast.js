export const generateBranchForecast = ({ movements = [], items = [], branch = "all", month = "" }) => {
  const issueMovements = movements.filter((m) => m.movement_type === "صرف فرع" && (branch === "all" || m.branch === branch));
  const grouped = issueMovements.reduce((acc, movement) => {
    const key = `${movement.branch || "غير محدد"}-${movement.item_id}`;
    if (!acc[key]) {
      const item = items.find((x) => x.item_id === movement.item_id) || {};
      acc[key] = {
        branch: movement.branch || "غير محدد",
        item_id: movement.item_id,
        item_name: movement.item_name,
        category: item.category || "",
        month: month || new Date().toISOString().slice(0, 7),
        total_issued_quantity: 0,
        current_balance: Number(item.current_balance || item.opening_balance || 0),
      };
    }
    acc[key].total_issued_quantity += Number(movement.quantity_out || 0);
    return acc;
  }, {});
  return Object.values(grouped).map((row) => {
    const average = Number((row.total_issued_quantity / 3).toFixed(2));
    const expected3 = Number((average * 3).toFixed(2));
    return {
      ...row,
      average_monthly_consumption: average,
      expected_need_next_month: average,
      expected_need_next_3_months: expected3,
      recommended_purchase_quantity: Math.max(0, expected3 - row.current_balance),
    };
  });
};
