import { useState, useEffect } from "react";
import { useTranslate, useInput } from "ra-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, GripVertical } from "lucide-react";

import type { InvoiceItem } from "../types";

export const InvoiceItemsInput = () => {
    const translate = useTranslate();
    const { field } = useInput({ source: "items" });
    const { field: discountField } = useInput({ source: "discount" });
    const { field: discountTypeField } = useInput({ source: "discount_type" });
    const [items, setItems] = useState<Partial<InvoiceItem>[]>(field.value || []);
    const [discount, setDiscount] = useState<number>(Number(discountField.value) || 0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(discountTypeField.value || 'fixed');

    const currencySymbol = "$"; // Multi-currency handled elsewhere via props, but $ is a safe default for symbols here.

    // Sync with form state
    useEffect(() => {
        field.onChange(items);
    }, [items]);

    useEffect(() => {
        discountField.onChange(discount);
    }, [discount]);

    useEffect(() => {
        discountTypeField.onChange(discountType);
    }, [discountType]);

    const addItem = () => {
        setItems([
            ...items,
            {
                description: "",
                quantity: 1,
                unit_price: 0,
                tax_rate: 0,
                tax_name: "",
                item_type: "service",
                sort_order: items.length,
            },
        ]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            [field]: value,
        };

        // Recalculate line totals
        const item = newItems[index];
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;

        item.line_total = quantity * unitPrice;
        item.tax_amount = (item.line_total * taxRate) / 100;
        item.line_total_with_tax = item.line_total + item.tax_amount;

        setItems(newItems);
    };

    const itemTypeChoices = [
        { value: "service", label: translate("crm.invoice.item_type.service") },
        { value: "product", label: translate("crm.invoice.item_type.product") },
        { value: "hour", label: translate("crm.invoice.item_type.hour") },
        { value: "day", label: translate("crm.invoice.item_type.day") },
        { value: "deposit", label: translate("crm.invoice.item_type.deposit") },
    ];

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const taxTotal = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);

    const calculatedTotal = discountType === 'percentage'
        ? (subtotal * (1 - discount / 100)) + taxTotal
        : (subtotal + taxTotal) - discount;

    const total = Math.max(0, calculatedTotal);

    return (
        <div className="space-y-4">
            {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>{translate("crm.invoice.empty_items")}</p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addItem}
                        className="mt-4"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {translate("crm.invoice.action.add_item")}
                    </Button>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="p-3 border rounded-lg bg-muted/30 flex flex-col gap-3"
                            >
                                <div className="grid grid-cols-12 gap-2 items-start">
                                    {/* Drag Handle */}
                                    <div className="col-span-1 flex items-center justify-center pt-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    </div>

                                    {/* Description (Title) */}
                                    <div className="col-span-4">
                                        <Input
                                            placeholder={translate("crm.invoice.item.description")}
                                            value={item.description || ""}
                                            onChange={(e) =>
                                                updateItem(index, "description", e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Item Type */}
                                    <div className="col-span-2">
                                        <Select
                                            value={item.item_type || "service"}
                                            onValueChange={(value) =>
                                                updateItem(index, "item_type", value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {itemTypeChoices.map((choice) => (
                                                    <SelectItem key={choice.value} value={choice.value}>
                                                        {choice.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-1">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            min="0"
                                            step="0.01"
                                            value={item.quantity || ""}
                                            onChange={(e) =>
                                                updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="col-span-1">
                                        <Input
                                            type="number"
                                            placeholder="Price"
                                            min="0"
                                            step="0.01"
                                            value={item.unit_price || ""}
                                            onChange={(e) =>
                                                updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </div>

                                    {/* Tax Rate */}
                                    <div className="col-span-1">
                                        <Input
                                            type="number"
                                            placeholder="Tax %"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={item.tax_rate || ""}
                                            onChange={(e) =>
                                                updateItem(index, "tax_rate", parseFloat(e.target.value) || 0)
                                            }
                                        />
                                    </div>

                                    {/* Line Total */}
                                    <div className="col-span-1 pt-2 text-right text-sm font-medium">
                                        {(item.line_total_with_tax || 0).toFixed(2)}
                                    </div>

                                    {/* Delete Button */}
                                    <div className="col-span-1 flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Extended Description Row */}
                                <div className="pl-10 pr-12">
                                    <Input // Using Input for single line extended description or Textarea? Input is cleaner for now.
                                        className="text-sm text-muted-foreground h-8"
                                        placeholder={translate("crm.invoice.item.item_description_placeholder") || "Add item details (optional)"}
                                        value={item.item_description || ""}
                                        onChange={(e) =>
                                            updateItem(index, "item_description", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Item Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addItem}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {translate("crm.invoice.action.add_item")}
                    </Button>

                    {/* Totals Summary */}
                    <div className="flex justify-end pt-4">
                        <div className="w-96 space-y-3 p-4 border rounded-lg bg-muted/30 shadow-sm">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{translate("crm.invoice.field.subtotal")}:</span>
                                <span className="font-medium">{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center gap-4">
                                <span className="text-muted-foreground shrink-0">{translate("crm.invoice.field.discount") || "Discount"}:</span>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                    <Select
                                        value={discountType}
                                        onValueChange={(value: 'fixed' | 'percentage') => setDiscountType(value)}
                                    >
                                        <SelectTrigger className="h-9 w-14 px-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">{currencySymbol}</SelectItem>
                                            <SelectItem value="percentage">%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-28 h-9 text-right bg-white"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{translate("crm.invoice.field.tax_total")}:</span>
                                <span className="font-medium">{taxTotal.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between text-lg font-bold">
                                <span>{translate("crm.invoice.field.total")}:</span>
                                <span>{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Hidden inputs to sync with form */}
                    <input type="hidden" name="subtotal" value={subtotal} />
                    <input type="hidden" name="discount" value={discount} />
                    <input type="hidden" name="discount_type" value={discountType} />
                    <input type="hidden" name="tax_total" value={taxTotal} />
                    <input type="hidden" name="total" value={total} />
                    <input type="hidden" name="amount_paid" value="0" />
                </>
            )}
        </div>
    );
};
