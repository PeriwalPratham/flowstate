function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}