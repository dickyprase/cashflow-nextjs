export function getActiveCycleDates(resetDay: number) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    let startDate: Date;
    let endDate: Date;

    if (d < resetDay) {
        startDate = new Date(y, m - 1, resetDay);
        endDate = new Date(y, m, resetDay - 1);
    } else {
        startDate = new Date(y, m, resetDay);
        endDate = new Date(y, m + 1, resetDay - 1);
    }

    return { startDate, endDate };
}
