import { RotatingLines } from "react-loader-spinner";

export default function Loader() {
  return (
    <div className="flex justify-center items-center p-4">
      <RotatingLines
        strokeColor="#fea900"
        strokeWidth="3"
        animationDuration="0.75"
        width="48"
        visible={true}
      />
    </div>
  )
}
