import { ArrowUpDown } from 'lucide-react';
import CustomSelect from './CustomSelect';

export default function ListSortSelect({
    value,
    onChange,
    options,
    ariaLabel = 'Sort list',
}) {
    return (
        <div className="min-w-0 sm:w-44 sm:flex-none">
            <CustomSelect
                value={value}
                onChange={onChange}
                options={options}
                placeholder="Sort by"
                leadingIcon={<ArrowUpDown size={14} />}
                aria-label={ariaLabel}
            />
        </div>
    );
}
