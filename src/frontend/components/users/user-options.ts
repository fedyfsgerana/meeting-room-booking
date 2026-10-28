import type { SelectOption } from "@/frontend/components/ui/search-select";

export function toDepartmentOptions(
  departments: Array<{ id: number; code: string; name: string }>,
): SelectOption[] {
  return departments.map((department) => ({
    value: String(department.id),
    label: `${department.name} (${department.code})`,
  }));
}

export function toGroupOptions(
  groups: Array<{ id: number; name: string }>,
): SelectOption[] {
  return groups.map((group) => ({
    value: String(group.id),
    label: group.name,
  }));
}
