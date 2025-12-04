import { cn } from "@/lib/utils";
import type { ToastContentProps } from "react-toastify";

export type ToastData = {
	title?: string;
	description?: string;
	action?: React.ReactNode;
};

export const Toast: React.FC<Partial<ToastContentProps<ToastData>>> = ({
	data,
}) => {
	return (
		<div className="flex justify-between w-full pr-3">
			<div className="flex flex-col">
				{data?.title ? <ToastTitle>{data.title}</ToastTitle> : null}
				{data?.description ? (
					<div className="text-sm opacity-90">{data.description}</div>
				) : null}
			</div>
			{data?.action ? data.action : null}
		</div>
	);
};

const ToastTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
	className,
	children,
}) => {
	return (
		<h4 className={cn("text-sm font-semibold [&+div]:text-xs", className)}>
			{children}
		</h4>
	);
};

export const ToastAction: React.FC<
	React.PropsWithChildren<React.ComponentProps<"button">>
> = ({ children, ...props }) => {
	return (
		<button
			{...props}
			type="button"
			className={cn(
				"inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
				props.className,
			)}
		>
			{children}
		</button>
	);
};
