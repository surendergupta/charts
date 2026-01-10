import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import GlassCard from "./ui/GlassCard";
type CardProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

const Card = ({ title, children, className = "" }: CardProps) => {
  return (
    <CardContainer className={`inter-var ${className}`}>
  <CardBody
    className="group/card relative rounded-xl p-6
    bg-white/5 backdrop-blur-xl
    border border-white/20"
  >
    {/* Title – OK to move in 3D */}
    {title && (
          <CardItem
            translateZ={40}
            className="text-xl font-bold text-neutral-800 mb-3"
          >
            {title}
          </CardItem>
        )}

    {/* Chart wrapper – NO translateZ */}
        <div className="relative">
          <GlassCard className="bg-white/10 border-white/20">
            {children}
          </GlassCard>
        </div>
  </CardBody>
</CardContainer>
  )
}

export default Card