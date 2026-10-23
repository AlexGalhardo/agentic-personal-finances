import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type VerifyEmailProps = {
	verifyUrl: string;
};

export function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Confirm your email to activate your account</Preview>
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
					<Heading style={{ color: "#f97316", fontSize: "20px" }}>Confirm your email</Heading>
					<Text style={{ color: "#e5e5e5", fontSize: "14px", lineHeight: "22px" }}>
						Click the button below to confirm your email and activate your account.
					</Text>
					<Button
						href={verifyUrl}
						style={{
							backgroundColor: "#f97316",
							color: "#0a0a0a",
							padding: "12px 24px",
							borderRadius: "8px",
							fontWeight: "bold",
							fontSize: "14px",
						}}
					>
						Confirm email
					</Button>
					<Text style={{ color: "#a3a3a3", fontSize: "12px", marginTop: "24px" }}>
						If you did not create this account, ignore this email.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

export default VerifyEmail;
