# TCP/IP Networking Fundamentals
--- Page 1 ---

## Why a Layered Model?

Computer networks are built from many cooperating pieces: cables and radios, switches and routers, operating system kernels, and applications such as web browsers. To keep this complexity manageable, engineers divide networking responsibilities into layers. Each layer offers a service to the layer above it and relies on the layer below it. A layer only needs to understand the interface of its neighbours, not their internal details.

The Internet uses the TCP/IP model, named after its two best-known protocols, the Transmission Control Protocol and the Internet Protocol. The model is usually described as having four layers, although some textbooks split the bottom layer in two and present five.

## The Four Layers of the TCP/IP Model

### Link Layer

The link layer moves frames between devices that share the same physical network segment, such as computers attached to one Ethernet switch or one Wi-Fi access point. Ethernet identifies devices with 48-bit MAC addresses, usually written as six pairs of hexadecimal digits such as 3c:22:fb:10:9a:7e. The link layer handles framing, local addressing and error detection; Ethernet frames carry a 32-bit cyclic redundancy check so that corrupted frames can be discarded.

### Internet Layer

The internet layer is responsible for delivering packets from a source host to a destination host across many interconnected networks. Its central protocol is IP. Routers operate at this layer: they read the destination IP address of each packet and forward it toward the next hop according to a routing table. IP is a best-effort service, which means it makes no promise that packets will arrive, arrive once, or arrive in order. Companion protocols at this layer include ICMP, which carries error and diagnostic messages and is used by the ping and traceroute tools.

### Transport Layer

The transport layer provides communication between processes rather than between machines. It uses 16-bit port numbers to identify which application on a host should receive the data, so port numbers range from 0 to 65535. The two dominant transport protocols are TCP, which offers a reliable ordered byte stream, and UDP, which offers lightweight unreliable datagrams.

### Application Layer

The application layer contains the protocols that programs use directly: HTTP for the web, SMTP for sending email, DNS for name lookup, SSH for secure remote login and many more. Well-known services are associated with standard ports, for example HTTP on port 80, HTTPS on port 443, SSH on port 22 and DNS on port 53.

### Encapsulation

When an application sends data, each layer wraps the data from the layer above in its own header. A chunk of HTTP data becomes the payload of a TCP segment, the segment becomes the payload of an IP packet, and the packet becomes the payload of an Ethernet frame. This process is called encapsulation. At the receiving end the headers are removed in reverse order, a process called decapsulation.

--- Page 2 ---

## IP Addressing

### IPv4 Addresses

An IPv4 address is a 32-bit number, which allows roughly 4.3 billion distinct addresses. It is normally written in dotted-decimal notation: four decimal numbers from 0 to 255 separated by dots, such as 192.168.1.20. Each of the four numbers represents one byte, or octet.

An address is divided into a network portion and a host portion. Modern networks describe this split using CIDR notation, short for Classless Inter-Domain Routing, introduced in 1993. In CIDR, a suffix such as /24 states how many leading bits belong to the network prefix. The block 192.168.1.0/24 therefore has 24 network bits and 8 host bits, giving 256 addresses. Two of these are normally reserved: the all-zeros host address names the network itself and the all-ones address (192.168.1.255) is the broadcast address, leaving 254 usable host addresses. The same prefix can be expressed as a subnet mask, here 255.255.255.0.

### Private Addresses and NAT

Because the IPv4 address space is too small for every device in the world, three ranges were reserved for private use by RFC 1918: 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16. Packets with these addresses are not routed on the public Internet. A home router typically gives private addresses to the devices inside the house and uses Network Address Translation (NAT) to share a single public address. NAT rewrites the source address and port of outgoing packets and keeps a translation table so that replies can be sent back to the correct internal device. The address 127.0.0.1 is the loopback address, which always refers to the local machine.

### IPv6

IPv6 was designed as the long-term solution to address exhaustion. An IPv6 address is 128 bits long, written as eight groups of four hexadecimal digits separated by colons, for example 2001:0db8:0000:0000:0000:ff00:0042:8329. Leading zeros in a group may be omitted, and one run of consecutive all-zero groups may be replaced with a double colon, so the same address can be written 2001:db8::ff00:42:8329. IPv6 also simplifies the header, removes in-network fragmentation by routers, and makes NAT largely unnecessary.

### Time to Live

Every IPv4 packet carries an 8-bit Time to Live (TTL) field. Each router that forwards the packet decreases the TTL by one, and a router that decrements it to zero discards the packet and sends an ICMP "time exceeded" message back to the sender. This prevents packets from looping forever when routing tables are misconfigured. The traceroute utility exploits this behaviour by sending probes with TTL values of 1, 2, 3 and so on, so that each successive router along the path reveals itself. In IPv6 the equivalent field is called the hop limit.

--- Page 3 ---

## TCP: Reliable Byte Streams

TCP turns IP's unreliable packet delivery into a reliable, ordered, connection-oriented byte stream. Applications write bytes into one end of a TCP connection and the same bytes, in the same order, emerge at the other end. To achieve this, TCP numbers every byte with a sequence number, requires the receiver to send acknowledgements, and retransmits data that is not acknowledged in time.

### The Three-Way Handshake

Before data flows, TCP establishes a connection using a three-way handshake:

1. The client sends a segment with the SYN flag set and a randomly chosen initial sequence number, call it x.
2. The server replies with a segment that has both SYN and ACK flags set. It acknowledges the client by setting the acknowledgement number to x + 1 and supplies its own initial sequence number y.
3. The client sends an ACK segment with acknowledgement number y + 1. The connection is now established in both directions.

The initial sequence numbers are randomised partly for security, to make it hard for an attacker to inject forged segments into a connection, and partly to avoid confusing segments from an old connection with a new one.

Closing a connection normally uses four segments, because each direction is shut down independently: one side sends FIN, the other acknowledges it, then the other side sends its own FIN, which is acknowledged in turn. The side that closes first enters a TIME_WAIT state lasting twice the maximum segment lifetime, so that any delayed segments from the old connection die out. A connection can also be aborted immediately with a segment carrying the RST flag.

### Acknowledgements and Retransmission

TCP acknowledgements are cumulative: an acknowledgement number of 5001 means "I have received every byte up to 5000 and I expect byte 5001 next." The sender keeps a retransmission timer. If an acknowledgement does not arrive before the retransmission timeout (RTO) expires, the sender resends the oldest unacknowledged segment. The RTO is computed from a smoothed estimate of the round-trip time plus a multiple of its variation, so that it adapts to the actual path.

Waiting for a timeout is slow, so TCP also uses fast retransmit. When a segment is lost but later segments arrive, the receiver keeps repeating the same acknowledgement number. After the sender receives three duplicate acknowledgements, it assumes the segment was lost and retransmits it immediately without waiting for the timer.

### Flow Control

Flow control prevents a fast sender from overwhelming a slow receiver. Each TCP segment carries a receive window field in which the receiver advertises how many bytes of free buffer space it currently has. The sender must never have more unacknowledged data in flight than this advertised window. If the receiver's buffer fills, it advertises a window of zero and the sender pauses, periodically sending small probe segments to learn when space has opened up. The original window field is only 16 bits, limiting the window to 65,535 bytes, so a window scale option negotiated during the handshake allows much larger windows on fast long-distance links.

--- Page 4 ---

### Congestion Control

Flow control protects the receiver; congestion control protects the network. If every sender transmitted as fast as its receiver allowed, router queues would overflow and the network could collapse into a state where most traffic is retransmissions. This actually happened on the early Internet in October 1986, when throughput between two sites dropped by a factor of about a thousand. Van Jacobson's congestion control algorithms, introduced in response, became part of standard TCP.

The sender maintains a congestion window (cwnd), and the amount of data it may have in flight is the smaller of cwnd and the receiver's advertised window. The classic algorithm has these phases:

- **Slow start.** A new connection begins with a small congestion window, commonly ten segments in modern implementations. For every acknowledged segment, cwnd grows by one segment, which doubles the window roughly every round-trip time. Despite its name, slow start therefore grows exponentially.
- **Congestion avoidance.** Once cwnd reaches a threshold called ssthresh, growth becomes linear: cwnd increases by about one segment per round-trip time.
- **Reaction to loss.** Packet loss is treated as a sign of congestion. On three duplicate acknowledgements, TCP Reno halves the congestion window and continues in congestion avoidance (fast recovery). On a retransmission timeout, the response is harsher: ssthresh is set to half the current window and cwnd falls back to one segment, restarting slow start.

This pattern of additive increase and multiplicative decrease, abbreviated AIMD, produces the familiar sawtooth graph of a TCP connection's sending rate. Linux now uses an algorithm called CUBIC by default, which grows the window as a cubic function of time since the last loss and performs better on high-bandwidth, high-latency paths. Google's BBR takes a different approach, estimating the bottleneck bandwidth and minimum round-trip time instead of relying on loss as the main signal.

## UDP: Simple Datagrams

The User Datagram Protocol provides a minimal transport service. Its header is just 8 bytes long, containing source port, destination port, length and checksum, compared with a minimum of 20 bytes for TCP. UDP has no handshake, no acknowledgements, no retransmission, no ordering and no congestion control. Each datagram is delivered independently, or not at all.

These missing features are an advantage for some applications. Real-time voice and video calls prefer to skip a late packet rather than wait for its retransmission, since stale audio is useless. Online games send frequent position updates where only the newest one matters. DNS queries usually fit in a single datagram, so a handshake would double the latency for no benefit. Applications that need some reliability on top of UDP implement it themselves. The QUIC protocol, which underlies HTTP/3, is a prominent example: it runs over UDP but implements its own encryption, reliable streams and congestion control in user space, combining the transport and TLS handshakes to reduce connection setup time.

--- Page 5 ---

## DNS: The Domain Name System

Humans prefer names such as www.example.org, while IP routes packets using numeric addresses. The Domain Name System translates between them. DNS is a distributed, hierarchical database: no single server knows every name, but every name can be found by following delegations from the top of the hierarchy.

### The Hierarchy

At the top is the root zone, served by 13 named root server identities, labelled A through M, each of which is actually replicated across many physical machines worldwide using anycast routing. Below the root are top-level domains (TLDs) such as .com, .org, .uk and .jp. Each TLD delegates second-level domains such as example.org to the authoritative name servers chosen by the domain's owner, and the owner may delegate further subdomains.

### Resolving a Name

When a browser needs an address, it asks a stub resolver in the operating system, which forwards the question to a recursive resolver, often run by the internet provider or by a public service. If the answer is not cached, the recursive resolver performs iterative resolution:

1. It asks a root server, which does not know the answer but refers it to the name servers for .org.
2. It asks a .org server, which refers it to the authoritative name servers for example.org.
3. It asks an authoritative server for example.org, which returns the final answer.

The recursive resolver passes the answer back to the client and stores it in its cache.

### Record Types

DNS stores several kinds of resource records:

- **A** maps a name to an IPv4 address.
- **AAAA** maps a name to an IPv6 address.
- **CNAME** makes one name an alias for another, canonical name.
- **MX** lists the mail servers that accept email for a domain, each with a preference number where lower values are tried first.
- **NS** names the authoritative name servers for a zone.
- **TXT** holds arbitrary text, widely used for domain ownership verification and email anti-spoofing policies.

### Caching and TTL

Every DNS record carries a time-to-live value in seconds that tells resolvers how long they may cache it. A record with a TTL of 3600 may be reused for one hour before the resolver must ask again. Long TTLs reduce lookup traffic and latency, while short TTLs let administrators change addresses quickly, for example during a server migration. Caching at many levels is the main reason DNS scales to billions of queries per day.

DNS traditionally uses UDP on port 53 for ordinary queries and falls back to TCP when a response is too large or when an entire zone is transferred between servers. Classic DNS messages travel unencrypted, so newer standards such as DNS over HTTPS and DNS over TLS wrap the queries in encryption to protect user privacy.

