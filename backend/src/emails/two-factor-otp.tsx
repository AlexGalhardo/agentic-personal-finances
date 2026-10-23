import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type TwoFactorOtpEmailProps = {
	code: string;
};

export function TwoFactorOtpEmail({ code }: TwoFactorOtpEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Your verification code: {code}</Preview>
			<Body style={{ backgroundColor: "#0a0a0a", fontFamily: "sans-serif", padding: "32px 0" }}>
				<Container
					style={{
						backgroundColor: "#171717",
						borderRadius: "12px",
						padding: "32px",
						maxWidth: "480px",
						border: "1px solid #f97316",
					}}
				>
					<Heading style={{ color: "#f97316", fontSize: "20px" }}>Verification code</Heading>
					<Text style={{ color: "#e5e5e5", fontSize: "14px", lineHeight: "22px" }}>
						Use the code below to confirm your two-factor sign-in. It expires in a few minutes.
					</Text>
					<Text
						style={{
							color: "#f97316",
							fontSize: "32px",
							fontWeight: "bold",
							letterSpacing: "8px",
							textAlign: "center",
							margin: "24px 0",
						}}
					>
						{code}
					</Text>
					<Text style={{ color: "#a3a3a3", fontSize: "12px" }}>
						If you did not try to sign in just now, ignore this email.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

export default TwoFactorOtpEmail;
