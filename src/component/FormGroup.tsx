import clsx from "clsx"

export function FormGroup(props: React.ComponentPropsWithoutRef<"div">){
    return (
    <div {...props} className={clsx("flex flex-col gab-1", props.className)}>
        {props.children}
    </div>

    );
}