import { IChecklistResultItem } from '@domain/ports/repositories';

export interface AnalyticsFilterState {
    periodPreset: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    dateFrom: string;
    dateTo: string;
    selectedEquipments: string[];
    checklistType: string;
    shiftFilter: 'ALL' | 'DAY' | 'NIGHT';
}

export interface SummaryMetrics {
    healthRate: number;
    isHealthCritical: boolean;
    totalDefects: number;
    criticalDefects: number;
    inProgressDefects: number;
    slaComplianceRate: number;
    completedChecks: number;
    expectedChecks: number;
    pendingApprovals: number;
    abandonedDrafts: number;
}

export interface EquipmentDefectStat {
    name: string;
    violations: number;
    totalChecks: number;
}

export interface SubsystemStat {
    name: string;
    count: number;
    percent: number;
}

export interface TimelineDataPoint {
    date: string;
    totalChecks: number;
    defectsCount: number;
}

export interface LiveIncidentItem {
    resultId: number;
    time: string;
    date: string;
    equipment_uid: string;
    nodeName: string;
    defectDescription: string;
    hasPhoto: boolean;
    operator: string;
    status: 'Требует ремонта' | 'В работе' | 'Устранено';
}

// 1. Фильтрация сырого массива результатов
export const filterResults = (
    results: IChecklistResultItem[],
    filters: AnalyticsFilterState
): IChecklistResultItem[] => {
    return results.filter((item) => {
        // Фильтр по смене
        if (filters.shiftFilter !== 'ALL' && item.shift_number !== filters.shiftFilter) {
            return false;
        }

        // Фильтр по типу чек-листа
        if (filters.checklistType !== 'ALL') {
            const typeDisplay = item.checklist_type_display || item.checklist_type || '';
            if (typeDisplay !== filters.checklistType) {
                return false;
            }
        }

        // Фильтр по мультиселекту оборудования
        if (
            filters.selectedEquipments.length > 0 &&
            !filters.selectedEquipments.includes(item.equipment_uid)
        ) {
            return false;
        }

        // Фильтр по диапазону дат
        if (filters.dateFrom && item.shift_date < filters.dateFrom) {
            return false;
        }
        if (filters.dateTo && item.shift_date > filters.dateTo) {
            return false;
        }

        return true;
    });
};

// 2. Расчет верхнеуровневых KPI
export const calculateSummaryMetrics = (results: IChecklistResultItem[]): SummaryMetrics => {
    const total = results.length;
    if (total === 0) {
        return {
            healthRate: 100,
            isHealthCritical: false,
            totalDefects: 0,
            criticalDefects: 0,
            inProgressDefects: 0,
            slaComplianceRate: 100,
            completedChecks: 0,
            expectedChecks: 0,
            pendingApprovals: 0,
            abandonedDrafts: 0,
        };
    }

    // Проверки без нарушений
    const withoutViolations = results.filter((r) => !r.has_violations).length;
    const healthRate = Number(((withoutViolations / total) * 100).toFixed(1));

    // Подсчет дефектов по группам
    let totalDefects = 0;
    let criticalDefects = 0;
    results.forEach((r) => {
        r.groups?.forEach((g) => {
            g.answers?.forEach((a) => {
                if (a.is_violation) {
                    totalDefects += 1;
                    if (
                        typeof a.value === 'string' &&
                        (a.value.toLowerCase().includes('критич') || a.value.toLowerCase().includes('перегрев'))
                    ) {
                        criticalDefects += 1;
                    }
                }
            });
        });
    });

    // Анкеты, ожидающие подписи мастера (APPROVER)
    const pendingApprovals = results.filter(
        (r) => !r.is_draft && !r.signatures.some((s) => s.role.toUpperCase() === 'APPROVER')
    ).length;

    // Брошенные черновики (is_draft = true старше 24 часов)
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const abandonedDrafts = results.filter(
        (r) => Boolean(r.is_draft) && now - new Date(r.created_at).getTime() > dayMs
    ).length;

    // Индекс выполнения регламента SLA
    const completedChecks = results.filter((r) => !r.is_draft).length;
    const expectedChecks = Math.max(total, 1);
    const slaComplianceRate = Math.min(
        100,
        Number(((completedChecks / expectedChecks) * 100).toFixed(1))
    );

    return {
        healthRate,
        isHealthCritical: healthRate < 90,
        totalDefects,
        criticalDefects,
        inProgressDefects: totalDefects - criticalDefects,
        slaComplianceRate,
        completedChecks,
        expectedChecks,
        pendingApprovals,
        abandonedDrafts,
    };
};

// 3. Расчет ТОП-5 проблемных станков
export const calculateTopEquipmentDefects = (
    results: IChecklistResultItem[]
): EquipmentDefectStat[] => {
    const map: Record<string, { violations: number; totalChecks: number }> = {};

    results.forEach((r) => {
        const eq = r.equipment_uid || 'Не указан';
        if (!map[eq]) {
            map[eq] = { violations: 0, totalChecks: 0 };
        }
        map[eq].totalChecks += 1;

        r.groups?.forEach((g) => {
            g.answers?.forEach((a) => {
                if (a.is_violation) {
                    map[eq].violations += 1;
                }
            });
        });
    });

    return Object.entries(map)
        .map(([name, stat]) => ({
            name,
            violations: stat.violations,
            totalChecks: stat.totalChecks,
        }))
        .sort((a, b) => b.violations - a.violations)
        .slice(0, 5);
};

// 4. Расчет распределения дефектов по узлам
export const calculateSubsystemDefects = (results: IChecklistResultItem[]): SubsystemStat[] => {
    const map: Record<string, number> = {};
    let totalDefectsCount = 0;

    results.forEach((r) => {
        r.groups?.forEach((g) => {
            g.answers?.forEach((a) => {
                if (a.is_violation) {
                    const groupTitle = g.group_name.replace(/^\d+\.\s*/, '');
                    map[groupTitle] = (map[groupTitle] || 0) + 1;
                    totalDefectsCount += 1;
                }
            });
        });
    });

    if (totalDefectsCount === 0) return [];

    return Object.entries(map)
        .map(([name, count]) => ({
            name,
            count,
            percent: Number(((count / totalDefectsCount) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count);
};

// 5. Динамика проверок и дефектов во времени
export const calculateTimelineData = (results: IChecklistResultItem[]): TimelineDataPoint[] => {
    const map: Record<string, { total: number; defects: number }> = {};

    results.forEach((r) => {
        const d = r.shift_date || r.created_at.slice(0, 10);
        if (!map[d]) {
            map[d] = { total: 0, defects: 0 };
        }
        map[d].total += 1;
        if (r.has_violations) {
            map[d].defects += 1;
        }
    });

    return Object.entries(map)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => ({
            date,
            totalChecks: data.total,
            defectsCount: data.defects,
        }));
};

// 6. Формирование оперативного журнала инцидентов
export const extractLiveIncidents = (results: IChecklistResultItem[]): LiveIncidentItem[] => {
    const incidents: LiveIncidentItem[] = [];

    results.forEach((r) => {
        r.groups?.forEach((g) => {
            g.answers?.forEach((a) => {
                if (a.is_violation) {
                    incidents.push({
                        resultId: r.id,
                        time: r.shift_time,
                        date: r.shift_date,
                        equipment_uid: r.equipment_uid,
                        nodeName: `${g.group_name}: ${a.field_name}`,
                        defectDescription: a.comment || `Отклонение от нормы: ${a.value}`,
                        hasPhoto: Boolean((a as any).attachments && (a as any).attachments.length > 0),
                        operator: r.user_uid,
                        status: r.is_completed ? 'В работе' : 'Требует ремонта',
                    });
                }
            });
        });
    });

    return incidents.slice(0, 10);
};