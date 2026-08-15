using System.Threading.Channels;

namespace SchoolCore.Business.Email;

public sealed record OutboundEmail(string ToAddress, string Subject, string HtmlBody);

public interface IEmailQueue
{
    ValueTask EnqueueAsync(OutboundEmail message, CancellationToken cancellationToken = default);
    IAsyncEnumerable<OutboundEmail> DequeueAllAsync(CancellationToken cancellationToken);
}

/// <summary>Cola in-process (MVP, sin Redis). Capacidad acotada para no saturar memoria.</summary>
public sealed class ChannelEmailQueue : IEmailQueue
{
    private readonly Channel<OutboundEmail> _channel =
        Channel.CreateBounded<OutboundEmail>(new BoundedChannelOptions(200)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });

    public ValueTask EnqueueAsync(OutboundEmail message, CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(message, cancellationToken);

    public IAsyncEnumerable<OutboundEmail> DequeueAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}
