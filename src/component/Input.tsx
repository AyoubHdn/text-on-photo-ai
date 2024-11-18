export function Input(props: React.ComponentPropsWithoutRef<"input">){
    return <input type="text" className="border border-gray-800 text-gray-800 px-4 py-2 rounded"{...props}></input>;
}