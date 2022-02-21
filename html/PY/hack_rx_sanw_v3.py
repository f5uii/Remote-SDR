#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#
# SPDX-License-Identifier: GPL-3.0
#
# GNU Radio Python Flow Graph
# Title: SSB AM NBFN WBFM  Receiver V3- F1ATB - OCT 2021
# Author: F1ATB - BUHART
# Description: RX for HACK RF or RTL-SDR
# GNU Radio version: 3.8.2.0

from gnuradio import analog
from gnuradio import blocks
from gnuradio import filter
from gnuradio.filter import firdes
from gnuradio import gr
import sys
import signal
from argparse import ArgumentParser
from gnuradio.eng_arg import eng_float, intx
from gnuradio import eng_notation
from gnuradio.fft import logpwrfft
import osmosdr
import time
try:
    from xmlrpc.server import SimpleXMLRPCServer
except ImportError:
    from SimpleXMLRPCServer import SimpleXMLRPCServer
import threading


class hack_rx_sanw_v3(gr.top_block):

    def __init__(self, device=''):
        gr.top_block.__init__(self, "SSB AM NBFN WBFM  Receiver V3- F1ATB - OCT 2021")

        ##################################################
        # Parameters
        ##################################################
        self.device = device

        ##################################################
        # Variables
        ##################################################
        self.samp_rate = samp_rate = 2400e3
        self.Modulation = Modulation = 0
        self.Largeur_filtre_WBFM = Largeur_filtre_WBFM = 150000
        self.Largeur_filtre_SSB = Largeur_filtre_SSB = 3800
        self.Largeur_filtre_NBFM = Largeur_filtre_NBFM = 10000
        self.Largeur_filtre_AM = Largeur_filtre_AM = 7500
        self.xlate_filter_taps_WBFM = xlate_filter_taps_WBFM = firdes.low_pass(1, samp_rate, Largeur_filtre_WBFM/2, 25000)
        self.xlate_filter_taps_SSB = xlate_filter_taps_SSB = firdes.low_pass(1, samp_rate, Largeur_filtre_SSB/2, 760)
        self.xlate_filter_taps_NBFM = xlate_filter_taps_NBFM = firdes.low_pass(1, samp_rate, Largeur_filtre_NBFM/2, 2000)
        self.xlate_filter_taps_AM = xlate_filter_taps_AM = firdes.low_pass(1, samp_rate, Largeur_filtre_AM/2, 1500)
        self.decim_LP = decim_LP = 16
        self.Squelch = Squelch = -80
        self.ModulSelect = ModulSelect = max(0,Modulation -1)
        self.LSB_USB = LSB_USB = min(1,Modulation)
        self.Gain_RF = Gain_RF = 0
        self.Gain_IF = Gain_IF = 20
        self.Gain_BB = Gain_BB = 20
        self.FrRX = FrRX = 7000000
        self.F_Fine = F_Fine = 0

        ##################################################
        # Blocks
        ##################################################
        self.xmlrpc_server_0 = SimpleXMLRPCServer(('localhost', 9003), allow_none=True)
        self.xmlrpc_server_0.register_instance(self)
        self.xmlrpc_server_0_thread = threading.Thread(target=self.xmlrpc_server_0.serve_forever)
        self.xmlrpc_server_0_thread.daemon = True
        self.xmlrpc_server_0_thread.start()
        self.osmosdr_source_0 = osmosdr.source(
            args="numchan=" + str(1) + " " + device
        )
        self.osmosdr_source_0.set_time_unknown_pps(osmosdr.time_spec_t())
        self.osmosdr_source_0.set_sample_rate(samp_rate)
        self.osmosdr_source_0.set_center_freq(FrRX, 0)
        self.osmosdr_source_0.set_freq_corr(0, 0)
        self.osmosdr_source_0.set_dc_offset_mode(2, 0)
        self.osmosdr_source_0.set_iq_balance_mode(0, 0)
        self.osmosdr_source_0.set_gain_mode(False, 0)
        self.osmosdr_source_0.set_gain(Gain_RF, 0)
        self.osmosdr_source_0.set_if_gain(Gain_IF, 0)
        self.osmosdr_source_0.set_bb_gain(Gain_BB, 0)
        self.osmosdr_source_0.set_antenna('', 0)
        self.osmosdr_source_0.set_bandwidth(0, 0)
        self.mmse_resampler_xx_0 = filter.mmse_resampler_cc(0, decim_LP)
        self.low_pass_filter_0 = filter.interp_fir_filter_ccf(
            1,
            firdes.low_pass(
                1,
                decim_LP*samp_rate/200,
                5200,
                1200,
                firdes.WIN_HAMMING,
                6.76))
        self.logpwrfft_x_0 = logpwrfft.logpwrfft_c(
            sample_rate=samp_rate/200,
            fft_size=2048,
            ref_scale=0.00001,
            frame_rate=samp_rate/200/2048,
            avg_alpha=1.0,
            average=False)
        self.freq_xlating_fir_filter_xxx_0_2 = filter.freq_xlating_fir_filter_ccc(15, xlate_filter_taps_WBFM, F_Fine, samp_rate)
        self.freq_xlating_fir_filter_xxx_0_1 = filter.freq_xlating_fir_filter_ccc(240, xlate_filter_taps_AM, F_Fine, samp_rate)
        self.freq_xlating_fir_filter_xxx_0_0 = filter.freq_xlating_fir_filter_ccc(60, xlate_filter_taps_NBFM, F_Fine, samp_rate)
        self.freq_xlating_fir_filter_xxx_0 = filter.freq_xlating_fir_filter_ccc(240, xlate_filter_taps_SSB, F_Fine-Largeur_filtre_SSB/2+LSB_USB*Largeur_filtre_SSB-100+LSB_USB*200, samp_rate)
        self.dc_blocker_xx_0 = filter.dc_blocker_cc(1024, True)
        self.blocks_udp_sink_1 = blocks.udp_sink(gr.sizeof_short*2048, '127.0.0.1', 9002, 4096, True)
        self.blocks_udp_sink_0 = blocks.udp_sink(gr.sizeof_short*1, '127.0.0.1', 9001, 1000, True)
        self.blocks_selector_1 = blocks.selector(gr.sizeof_float*1,ModulSelect,0)
        self.blocks_selector_1.set_enabled(True)
        self.blocks_selector_0 = blocks.selector(gr.sizeof_gr_complex*1,0,ModulSelect)
        self.blocks_selector_0.set_enabled(True)
        self.blocks_multiply_xx_0_0 = blocks.multiply_vff(1)
        self.blocks_multiply_xx_0 = blocks.multiply_vff(1)
        self.blocks_multiply_const_vxx_0 = blocks.multiply_const_ff(1-2*LSB_USB)
        self.blocks_keep_m_in_n_0 = blocks.keep_m_in_n(gr.sizeof_gr_complex, int(2048*decim_LP), 409600, 0)
        self.blocks_float_to_short_1 = blocks.float_to_short(2048, 100)
        self.blocks_float_to_short_0 = blocks.float_to_short(1, 16000)
        self.blocks_complex_to_mag_0 = blocks.complex_to_mag(1)
        self.blocks_complex_to_float_0_0 = blocks.complex_to_float(1)
        self.blocks_complex_to_float_0 = blocks.complex_to_float(1)
        self.blocks_add_xx_0 = blocks.add_vff(1)
        self.analog_wfm_rcv_0 = analog.wfm_rcv(
        	quad_rate=samp_rate/15,
        	audio_decimation=16,
        )
        self.analog_simple_squelch_cc_0_1 = analog.simple_squelch_cc(Squelch, 1)
        self.analog_simple_squelch_cc_0_0 = analog.simple_squelch_cc(Squelch, 1)
        self.analog_simple_squelch_cc_0 = analog.simple_squelch_cc(Squelch, 1)
        self.analog_sig_source_x_0 = analog.sig_source_c(samp_rate/240, analog.GR_COS_WAVE, Largeur_filtre_SSB/2+100, 1, 0, 0)
        self.analog_nbfm_rx_0 = analog.nbfm_rx(
        	audio_rate=int(samp_rate/240),
        	quad_rate=int(samp_rate/60),
        	tau=75e-6,
        	max_dev=5e3,
          )
        self.analog_agc_xx_0 = analog.agc_cc(1e-4, 1.0, 1.0)
        self.analog_agc_xx_0.set_max_gain(20000)
        self.analog_agc2_xx_0 = analog.agc2_cc(0.1, 0.01, 1.0, 1.0)
        self.analog_agc2_xx_0.set_max_gain(100)



        ##################################################
        # Connections
        ##################################################
        self.connect((self.analog_agc2_xx_0, 0), (self.blocks_complex_to_float_0, 0))
        self.connect((self.analog_agc_xx_0, 0), (self.analog_simple_squelch_cc_0_0, 0))
        self.connect((self.analog_nbfm_rx_0, 0), (self.blocks_selector_1, 2))
        self.connect((self.analog_sig_source_x_0, 0), (self.blocks_complex_to_float_0_0, 0))
        self.connect((self.analog_simple_squelch_cc_0, 0), (self.analog_nbfm_rx_0, 0))
        self.connect((self.analog_simple_squelch_cc_0_0, 0), (self.blocks_complex_to_mag_0, 0))
        self.connect((self.analog_simple_squelch_cc_0_1, 0), (self.analog_wfm_rcv_0, 0))
        self.connect((self.analog_wfm_rcv_0, 0), (self.blocks_selector_1, 3))
        self.connect((self.blocks_add_xx_0, 0), (self.blocks_selector_1, 0))
        self.connect((self.blocks_complex_to_float_0, 0), (self.blocks_multiply_const_vxx_0, 0))
        self.connect((self.blocks_complex_to_float_0, 1), (self.blocks_multiply_xx_0_0, 0))
        self.connect((self.blocks_complex_to_float_0_0, 0), (self.blocks_multiply_xx_0, 0))
        self.connect((self.blocks_complex_to_float_0_0, 1), (self.blocks_multiply_xx_0_0, 1))
        self.connect((self.blocks_complex_to_mag_0, 0), (self.blocks_selector_1, 1))
        self.connect((self.blocks_float_to_short_0, 0), (self.blocks_udp_sink_0, 0))
        self.connect((self.blocks_float_to_short_1, 0), (self.blocks_udp_sink_1, 0))
        self.connect((self.blocks_keep_m_in_n_0, 0), (self.low_pass_filter_0, 0))
        self.connect((self.blocks_multiply_const_vxx_0, 0), (self.blocks_multiply_xx_0, 1))
        self.connect((self.blocks_multiply_xx_0, 0), (self.blocks_add_xx_0, 0))
        self.connect((self.blocks_multiply_xx_0_0, 0), (self.blocks_add_xx_0, 1))
        self.connect((self.blocks_selector_0, 0), (self.freq_xlating_fir_filter_xxx_0, 0))
        self.connect((self.blocks_selector_0, 2), (self.freq_xlating_fir_filter_xxx_0_0, 0))
        self.connect((self.blocks_selector_0, 1), (self.freq_xlating_fir_filter_xxx_0_1, 0))
        self.connect((self.blocks_selector_0, 3), (self.freq_xlating_fir_filter_xxx_0_2, 0))
        self.connect((self.blocks_selector_1, 0), (self.blocks_float_to_short_0, 0))
        self.connect((self.dc_blocker_xx_0, 0), (self.blocks_keep_m_in_n_0, 0))
        self.connect((self.dc_blocker_xx_0, 0), (self.blocks_selector_0, 0))
        self.connect((self.freq_xlating_fir_filter_xxx_0, 0), (self.analog_agc2_xx_0, 0))
        self.connect((self.freq_xlating_fir_filter_xxx_0_0, 0), (self.analog_simple_squelch_cc_0, 0))
        self.connect((self.freq_xlating_fir_filter_xxx_0_1, 0), (self.analog_agc_xx_0, 0))
        self.connect((self.freq_xlating_fir_filter_xxx_0_2, 0), (self.analog_simple_squelch_cc_0_1, 0))
        self.connect((self.logpwrfft_x_0, 0), (self.blocks_float_to_short_1, 0))
        self.connect((self.low_pass_filter_0, 0), (self.mmse_resampler_xx_0, 0))
        self.connect((self.mmse_resampler_xx_0, 0), (self.logpwrfft_x_0, 0))
        self.connect((self.osmosdr_source_0, 0), (self.dc_blocker_xx_0, 0))


    def get_device(self):
        return self.device

    def set_device(self, device):
        self.device = device

    def get_samp_rate(self):
        return self.samp_rate

    def set_samp_rate(self, samp_rate):
        self.samp_rate = samp_rate
        self.set_xlate_filter_taps_AM(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_AM/2, 1500))
        self.set_xlate_filter_taps_NBFM(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_NBFM/2, 2000))
        self.set_xlate_filter_taps_SSB(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_SSB/2, 760))
        self.set_xlate_filter_taps_WBFM(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_WBFM/2, 25000))
        self.analog_sig_source_x_0.set_sampling_freq(self.samp_rate/240)
        self.logpwrfft_x_0.set_sample_rate(self.samp_rate/200)
        self.low_pass_filter_0.set_taps(firdes.low_pass(1, self.decim_LP*self.samp_rate/200, 5200, 1200, firdes.WIN_HAMMING, 6.76))
        self.osmosdr_source_0.set_sample_rate(self.samp_rate)

    def get_Modulation(self):
        return self.Modulation

    def set_Modulation(self, Modulation):
        self.Modulation = Modulation
        self.set_LSB_USB(min(1,self.Modulation))
        self.set_ModulSelect(max(0,self.Modulation -1))

    def get_Largeur_filtre_WBFM(self):
        return self.Largeur_filtre_WBFM

    def set_Largeur_filtre_WBFM(self, Largeur_filtre_WBFM):
        self.Largeur_filtre_WBFM = Largeur_filtre_WBFM
        self.set_xlate_filter_taps_WBFM(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_WBFM/2, 25000))

    def get_Largeur_filtre_SSB(self):
        return self.Largeur_filtre_SSB

    def set_Largeur_filtre_SSB(self, Largeur_filtre_SSB):
        self.Largeur_filtre_SSB = Largeur_filtre_SSB
        self.set_xlate_filter_taps_SSB(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_SSB/2, 760))
        self.analog_sig_source_x_0.set_frequency(self.Largeur_filtre_SSB/2+100)
        self.freq_xlating_fir_filter_xxx_0.set_center_freq(self.F_Fine-self.Largeur_filtre_SSB/2+self.LSB_USB*self.Largeur_filtre_SSB-100+self.LSB_USB*200)

    def get_Largeur_filtre_NBFM(self):
        return self.Largeur_filtre_NBFM

    def set_Largeur_filtre_NBFM(self, Largeur_filtre_NBFM):
        self.Largeur_filtre_NBFM = Largeur_filtre_NBFM
        self.set_xlate_filter_taps_NBFM(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_NBFM/2, 2000))

    def get_Largeur_filtre_AM(self):
        return self.Largeur_filtre_AM

    def set_Largeur_filtre_AM(self, Largeur_filtre_AM):
        self.Largeur_filtre_AM = Largeur_filtre_AM
        self.set_xlate_filter_taps_AM(firdes.low_pass(1, self.samp_rate, self.Largeur_filtre_AM/2, 1500))

    def get_xlate_filter_taps_WBFM(self):
        return self.xlate_filter_taps_WBFM

    def set_xlate_filter_taps_WBFM(self, xlate_filter_taps_WBFM):
        self.xlate_filter_taps_WBFM = xlate_filter_taps_WBFM
        self.freq_xlating_fir_filter_xxx_0_2.set_taps(self.xlate_filter_taps_WBFM)

    def get_xlate_filter_taps_SSB(self):
        return self.xlate_filter_taps_SSB

    def set_xlate_filter_taps_SSB(self, xlate_filter_taps_SSB):
        self.xlate_filter_taps_SSB = xlate_filter_taps_SSB
        self.freq_xlating_fir_filter_xxx_0.set_taps(self.xlate_filter_taps_SSB)

    def get_xlate_filter_taps_NBFM(self):
        return self.xlate_filter_taps_NBFM

    def set_xlate_filter_taps_NBFM(self, xlate_filter_taps_NBFM):
        self.xlate_filter_taps_NBFM = xlate_filter_taps_NBFM
        self.freq_xlating_fir_filter_xxx_0_0.set_taps(self.xlate_filter_taps_NBFM)

    def get_xlate_filter_taps_AM(self):
        return self.xlate_filter_taps_AM

    def set_xlate_filter_taps_AM(self, xlate_filter_taps_AM):
        self.xlate_filter_taps_AM = xlate_filter_taps_AM
        self.freq_xlating_fir_filter_xxx_0_1.set_taps(self.xlate_filter_taps_AM)

    def get_decim_LP(self):
        return self.decim_LP

    def set_decim_LP(self, decim_LP):
        self.decim_LP = decim_LP
        self.blocks_keep_m_in_n_0.set_m(int(2048*self.decim_LP))
        self.low_pass_filter_0.set_taps(firdes.low_pass(1, self.decim_LP*self.samp_rate/200, 5200, 1200, firdes.WIN_HAMMING, 6.76))
        self.mmse_resampler_xx_0.set_resamp_ratio(self.decim_LP)

    def get_Squelch(self):
        return self.Squelch

    def set_Squelch(self, Squelch):
        self.Squelch = Squelch
        self.analog_simple_squelch_cc_0.set_threshold(self.Squelch)
        self.analog_simple_squelch_cc_0_0.set_threshold(self.Squelch)
        self.analog_simple_squelch_cc_0_1.set_threshold(self.Squelch)

    def get_ModulSelect(self):
        return self.ModulSelect

    def set_ModulSelect(self, ModulSelect):
        self.ModulSelect = ModulSelect
        self.blocks_selector_0.set_output_index(self.ModulSelect)
        self.blocks_selector_1.set_input_index(self.ModulSelect)

    def get_LSB_USB(self):
        return self.LSB_USB

    def set_LSB_USB(self, LSB_USB):
        self.LSB_USB = LSB_USB
        self.blocks_multiply_const_vxx_0.set_k(1-2*self.LSB_USB)
        self.freq_xlating_fir_filter_xxx_0.set_center_freq(self.F_Fine-self.Largeur_filtre_SSB/2+self.LSB_USB*self.Largeur_filtre_SSB-100+self.LSB_USB*200)

    def get_Gain_RF(self):
        return self.Gain_RF

    def set_Gain_RF(self, Gain_RF):
        self.Gain_RF = Gain_RF
        self.osmosdr_source_0.set_gain(self.Gain_RF, 0)

    def get_Gain_IF(self):
        return self.Gain_IF

    def set_Gain_IF(self, Gain_IF):
        self.Gain_IF = Gain_IF
        self.osmosdr_source_0.set_if_gain(self.Gain_IF, 0)

    def get_Gain_BB(self):
        return self.Gain_BB

    def set_Gain_BB(self, Gain_BB):
        self.Gain_BB = Gain_BB
        self.osmosdr_source_0.set_bb_gain(self.Gain_BB, 0)

    def get_FrRX(self):
        return self.FrRX

    def set_FrRX(self, FrRX):
        self.FrRX = FrRX
        self.osmosdr_source_0.set_center_freq(self.FrRX, 0)

    def get_F_Fine(self):
        return self.F_Fine

    def set_F_Fine(self, F_Fine):
        self.F_Fine = F_Fine
        self.freq_xlating_fir_filter_xxx_0.set_center_freq(self.F_Fine-self.Largeur_filtre_SSB/2+self.LSB_USB*self.Largeur_filtre_SSB-100+self.LSB_USB*200)
        self.freq_xlating_fir_filter_xxx_0_0.set_center_freq(self.F_Fine)
        self.freq_xlating_fir_filter_xxx_0_1.set_center_freq(self.F_Fine)
        self.freq_xlating_fir_filter_xxx_0_2.set_center_freq(self.F_Fine)




def argument_parser():
    description = 'RX for HACK RF or RTL-SDR'
    parser = ArgumentParser(description=description)
    parser.add_argument(
        "--device", dest="device", type=str, default='',
        help="Set device [default=%(default)r]")
    return parser


def main(top_block_cls=hack_rx_sanw_v3, options=None):
    if options is None:
        options = argument_parser().parse_args()
    tb = top_block_cls(device=options.device)

    def sig_handler(sig=None, frame=None):
        tb.stop()
        tb.wait()

        sys.exit(0)

    signal.signal(signal.SIGINT, sig_handler)
    signal.signal(signal.SIGTERM, sig_handler)

    tb.start()

    tb.wait()


if __name__ == '__main__':
    main()
