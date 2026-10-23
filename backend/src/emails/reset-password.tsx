import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type ResetPasswordEmailProps = {
	resetUrl: string;
};

export function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Reset your password</Preview>
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
					<Heading style={{ color: "#f97316", fontSize: "20px" }}>Reset password</Heading>
					<Text style={{ color: "#e5e5e5", fontSize: "14px", lineHeight: "22px" }}>
						We received a request to reset your password. Click the button below to choose a new password.
						This link expires soon.
					</Text>
					<Button
						href={resetUrl}
						style={{
							backgroundColor: "#f97316",
							color: "#0a0a0a",
							padding: "12px 24px",
							borderRadius: "8px",
							fontWeight: "bold",
							fontSize: "14px",
						}}
					>
						Reset password
					</Button>
					<Text style={{ color: "#a3a3a3", fontSize: "12px", marginTop: "24px" }}>
						If you did not request this change, ignore this email — your password stays the same.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

export default ResetPasswordEmail;
