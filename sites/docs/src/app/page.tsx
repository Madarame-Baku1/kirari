import { LandingPage } from '../components/LandingPage'
import { description, pageMetadata, serializeJsonLd, softwareSchema } from '../seo'

export const metadata = pageMetadata(
	'Lightweight syntax highlighting for the web',
	description,
	'/',
)

const Home = () => (
	<>
		<LandingPage />
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON-LD escapes HTML delimiters
			dangerouslySetInnerHTML={{
				__html: serializeJsonLd(softwareSchema),
			}}
		/>
	</>
)

export default Home
