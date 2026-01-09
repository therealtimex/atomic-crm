import { useTranslate } from "ra-core";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Percent } from "lucide-react";

export const TaxPresetSelector = ({ onSelect }: { onSelect?: (rate: number) => void }) => {
    const translate = useTranslate();
    const { setValue } = useFormContext();

    const presets = [
        { label: "0%", value: 0 },
        { label: "5%", value: 5 },
        { label: "10%", value: 10 },
        { label: "15%", value: 15 },
        { label: "20%", value: 20 },
        { label: "25%", value: 25 },
    ];

    const handleSelect = (value: number) => {
        if (onSelect) {
            onSelect(value);
        } else {
            // If used within many line items, this might not work globally
            // But for a global default or if passed an index-specific setter
            console.log("Tax preset selected:", value);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Percent className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {presets.map((preset) => (
                    <DropdownMenuItem
                        key={preset.value}
                        onClick={() => handleSelect(preset.value)}
                    >
                        {preset.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
